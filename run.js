import readline from "readline";
import chalk from "chalk"; // Mengimpor chalk untuk warna

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Fungsi untuk menampilkan banner dengan warna-warni
function showBanner() {
    const banner = `
    \x1b[34m____\x1b[0m                           
   \x1b[34m/ __ \\____ __________ ______\x1b[0m    
  \x1b[34m/ / / / __ \`/ ___/ __ \`/ ___/\x1b[0m    
 \x1b[34m/ /_/ / /_/ (__  ) /_/ / /\x1b[0m        
\x1b[34m/_____/_\__,_/____/\__,_/_/\x1b[0m          
    
    \x1b[32m____\x1b[0m                       \x1b[33m__\x1b[0m    
   \x1b[32m/ __ \\___  ____ ___  __  __/ /_\x1b[0m \x1b[33m ______  ____ _\x1b[0m    
  \x1b[32m/ /_/ / _ \\/ __ \`__ \\/ / / / / /\x1b[0m \x1b[33m/ __ \/ __ \`/\x1b[0m    
 \x1b[32m/ ____/  __/ / / / / / /_/ / / /\x1b[0m \x1b[33m/ / / / /_/ /\x1b[0m     
\x1b[32m/_/    \___/_/ /_/ /_/\__,_/_/\x1b[0m \x1b[33m/ / /_/\__, /\x1b[0m      
                                         \x1b[33m/____/\x1b[0m        
    
====================================================    
     \x1b[35mAutomation\x1b[0m         : \x1b[36mAuto Install Node and Bot\x1b[0m    
     \x1b[35mTelegram Channel\x1b[0m   : \x1b[36m@dasarpemulung\x1b[0m    
     \x1b[35mTelegram Group\x1b[0m     : \x1b[36m@parapemulung\x1b[0m    
     \x1b[35mCredit\x1b[0m\t\t: \x1b[36m@jeripangestu, @Hunga9k50doker\x1b[0m  
====================================================    
    `;

    console.log(banner); // Menampilkan banner dengan warna-warni
    showMenu(); // Menampilkan menu setelah banner
}

// Fungsi untuk menjalankan bot berdasarkan pilihan
async function runBot(option) {
    switch (option) {
        case '1':
            const setup = await import("./setup.js");
            setup.createWallet(); // Memanggil fungsi createWallet dari setup.js
            break;
        case '2':
            const main = await import("./main.js");
            main.faucet(); // Memanggil fungsi faucet dari main.js
            break;
        case '3':
            const deploy = await import("./deploy.js");
            deploy.deployToken(); // Memanggil fungsi deployToken dari deploy.js
            break;
        case '4':
            const bridge = await import("./bridge.js");
            bridge.bridge(); // Memanggil fungsi bridge dari bridge.js
            break;
        case '5':
            const pk = await import("./pk.js");
            pk.pk(); // Memanggil fungsi pk dari pk.js
            break;
        case '6':
            const mint = await import("./mint.js");
            mint.mintNFT(); // Memanggil fungsi mintNFT dari mint.js
            break;
        case '7':
            console.log(chalk.green("Terima kasih telah menggunakan aplikasi ini!"));
            rl.close(); // Menutup readline interface
            return; // Keluar dari fungsi
        default:
            console.log(chalk.red("Pilihan tidak valid. Silakan pilih angka antara 1 dan 7."));
            break;
    }

    // Kembali ke menu setelah selesai
    showMenu();
}

// Fungsi untuk menampilkan menu
function showMenu() {
    console.log(chalk.blue("==================================="));
    console.log(chalk.green("Pilih bot yang ingin dijalankan:"));
    console.log(chalk.yellow("1. Create New Wallet"));
    console.log(chalk.yellow("2. Faucet"));
    console.log(chalk.yellow("3. Deploy Token"));
    console.log(chalk.yellow("4. Send ETH Sepolia and Auto Bridge"));
    console.log(chalk.yellow("5. Auto Generate address (V1) "));
    console.log(chalk.yellow("6. Mint NFT"));
    console.log(chalk.yellow("7. Exit"));
    console.log(chalk.blue("==================================="));

    rl.question(chalk.cyan("Masukkan pilihan Anda: "), (option) => {
        runBot(option).catch(console.error);
    });
}

// Tampilkan banner sebelum menu
showBanner();