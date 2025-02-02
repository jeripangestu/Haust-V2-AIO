import fs from 'fs';
import { Wallet } from 'ethers';

// Fungsi untuk membaca baris dari file
function readLines(filePath) {
    return new Promise((resolve, reject) => {
        const lines = [];
        fs.createReadStream(filePath)
            .on('data', (chunk) => {
                lines.push(...chunk.toString().split('\n'));
            })
            .on('end', () => {
                resolve(lines.filter(line => line.trim() !== ''));
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Fungsi utama
async function main() {
    try {
        const privateKeys = await readLines('pk.txt'); // Membaca file pk.txt

        // Membentuk objek wallet berdasarkan private key dari pk.txt
        const wallets = privateKeys.map((privateKey) => {
            const wallet = new Wallet(privateKey.trim());
            const mnemonic = wallet.mnemonic
                ? wallet.mnemonic.phrase
                : "Cannot generate mnemonic from this private key"; // Jika mnemonic tidak bisa dihasilkan
            return {
                address: wallet.address,
                privateKey: wallet.privateKey,
                mnemonic: mnemonic
            };
        });

        // Menyimpan data ke file wallets.json
        fs.writeFileSync('wallets.json', JSON.stringify(wallets, null, 2));
        console.log("Wallets saved to wallets.json");
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
    }
}

// Jalankan fungsi utama
main();
