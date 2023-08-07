const { readFileSyncData, updateFileSync } = require("./util");

function calculatePrayerTimes(date) {
  // Anda dapat menggunakan pustaka atau API khusus untuk menghitung waktu-waktu sholat
  // Di sini, saya hanya memberikan contoh format waktu sholat
    const jsonData = readFileSyncData('./src/script/lib/waktuSholat.json')
    const lengthOfFiles = Object.keys(jsonData).length
    if (lengthOfFiles != 0) {
        return jsonData
    }
}

async function updatePrayerTimesByCity(city = "Jakarta") {
    const year = new Date().getFullYear()
    const month = new Date().getMonth() + 1
    const rawDataWaktuSholat = await fetch(`https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=${city}&country=Indonesia&method=1`)
    const dataWaktuSholat = await rawDataWaktuSholat.json()
    const timings = dataWaktuSholat.data[0].timings
    for (const key in timings) {
        timings[key] = timings[key].replace("(WIB)", "").trim()
    }
    const resultUpdate = updateFileSync('./src/script/lib/waktuSholat.json', timings)
    if (resultUpdate) {
        const data = readFileSyncData('./src/script/lib/waktuSholat.json')
        return data
    }
}

const checkWaktuSholat = () => {
    const data = readFileSyncData('./src/script/lib/waktuSholat.json')
    let waktuSholat = ''
    for (const key in data) {
        waktuSholat += `${key} : ${data[key].replace("(WIB)", "").trim()}  ||   `
    }
    return waktuSholat
}

function monitorPrayerTimes(sendText) {
  const currentDate = new Date();
  const prayerTimes = calculatePrayerTimes(currentDate);
  let waktuAkanDatang = ""
  console.log('Start');

  for (const prayer in prayerTimes) {
    const prayerTime = new Date(
        `${currentDate.toDateString()} ${prayerTimes[prayer]}`
      );
    const timeDiff = prayerTime - currentDate;
    waktuAkanDatang += `Waktu ${prayer} akan datang dalam ${prayerTime}`

    if (timeDiff > 0 && timeDiff <= 60000) {
      // Memunculkan pemberitahuan jika waktu sholat dalam 1 menit
      sendText(`Waktu ${prayer} akan datang dalam 1 menit!`)
    }
  }
  return waktuAkanDatang
}

module.exports = {monitorPrayerTimes, updatePrayerTimesByCity, checkWaktuSholat}