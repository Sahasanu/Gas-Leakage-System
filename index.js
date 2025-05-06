let bleDevice;
let bleCharacteristic;

document.addEventListener("DOMContentLoaded", () => {
    const connectButton = document.querySelector(".connect");
    const gasReadingEl = document.querySelector(".gasreading");
    const resultEl = document.querySelector(".result");
    const percentTextEl = document.querySelector(".percent-text");
    const progressCircle = document.querySelector(".progress-ring");

    async function connectBluetooth() {
        try {
            bleDevice = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['12345678-1234-5678-1234-56789abcdef0']
            });

            const server = await bleDevice.gatt.connect();
            const service = await server.getPrimaryService('12345678-1234-5678-1234-56789abcdef0');
            bleCharacteristic = await service.getCharacteristic('abcd1234-5678-1234-5678-abcdef123456');

            bleCharacteristic.addEventListener("characteristicvaluechanged", event => {
                const decoder = new TextDecoder();
                const value = decoder.decode(event.target.value);
                const gasValue = parseInt(value.trim());

                if (!isNaN(gasValue)) {
                    gasReadingEl.textContent = gasValue;
                    percentTextEl.textContent = gasValue + "%";
                    updateMeter(gasValue);

                    resultEl.textContent = gasValue >= 50 ? "Warning!" : "Normal";
                    resultEl.style.color = gasValue >= 50 ? "red" : "green";
                }
            });

            await bleCharacteristic.startNotifications();
            connectButton.innerText = "Disconnect";
            connectButton.style.backgroundColor = "red";

            bleDevice.addEventListener("gattserverdisconnected", onDisconnected);
            alert("✅ Connected to ESP32!");
        } catch (error) {
            alert("❌ Could not connect to ESP32");
            console.error(error);
        }
    }

    function disconnectBluetooth() {
        if (bleDevice && bleDevice.gatt.connected) {
            bleDevice.gatt.disconnect();
        }
    }

    function onDisconnected() {
        connectButton.innerText = "Connect";
        connectButton.style.backgroundColor = "green";
        gasReadingEl.textContent = "0";
        percentTextEl.textContent = "0%";
        updateMeter(0);
        resultEl.textContent = "Normal";
    }

    function updateMeter(gasLevel) {
        const circle = progressCircle;
        const percentText = percentTextEl;
    
        const radius = 85;
        const circumference = 2 * Math.PI * radius;
        const value = Math.min(Math.max(gasLevel, 0), 100); 
        const offset = circumference - (value / 100) * circumference;
    
        circle.style.strokeDashoffset = offset;
        percentText.textContent = `${value}%`;
    }

    connectButton.addEventListener("click", () => {
        if (bleDevice && bleDevice.gatt.connected) {
            disconnectBluetooth();
        } else {
            connectBluetooth();
        }
    });
});
