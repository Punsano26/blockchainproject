import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import contractABI from './contractABI';

const SmartWallet = () => {
  const [balance, setBalance] = useState('0');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('eth'); // ค่าเริ่มต้นเป็น ETH
  const [unlockTime, setUnlockTime] = useState(null);
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState(''); // เพิ่มการตั้งค่า status

  // Smart contract address และ ABI
  const contractAddress = "0xD357C19cE31dB04DF037ea073D76D7160D7bbcC6";

  const connectMetaMask = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' }); // ขออนุญาตเชื่อมต่อกับ MetaMask
      const signer = await provider.getSigner(); // ใช้ await เพื่อให้ได้ signer ที่สามารถเรียกใช้งานได้
      const userAddress = await signer.getAddress(); // ได้ address จาก signer
      setAccount(userAddress); // ตั้งค่าบัญชีที่เชื่อมต่อ
      return new ethers.Contract(contractAddress, contractABI, signer); // ส่งคืน contract instance
    } else {
      alert("กรุณาติดตั้ง MetaMask");
    }
  };

  // ดึง balance ของผู้ใช้
  const fetchBalance = async () => {
    try {
      const contract = await connectMetaMask();
      const balance = await contract.getBalance(); // แก้ไขการเรียกใช้งานเป็นฟังก์ชัน getBalance
      setBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error(error);
      setStatus("เกิดข้อผิดพลาดระหว่างการดึงยอดเงิน");
    }
  };

  // ฝากเงิน
  const handleDeposit = async () => {
    if (!amount || isNaN(amount)) {
      alert("กรุณากรอกจำนวนเงินที่ถูกต้อง");
      return;
    }

    try {
      const contract = await connectMetaMask();
      alert("กำลังฝาก...");
      const transaction = await contract.deposit({ value: ethers.utils.parseEther(amount) });
      await transaction.wait();
      alert("ฝากเงินสำเร็จ!");
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดระหว่างการฝากเงิน");
    }
  };

  // ถอนเงิน
  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("กรุณากรอกจำนวนเงินที่ต้องการถอน");
      return;
    }

    try {
      const contract = await connectMetaMask();
      const value = unit === 'eth' ? ethers.utils.parseEther(amount) : ethers.BigNumber.from(amount); // แปลงหน่วยตามที่เลือก
      await contract.withdraw(value);
      fetchBalance(); // ดึงข้อมูลยอดเงินใหม่
      setStatus("ถอนเงินสำเร็จ!");
    } catch (error) {
      console.error(error);
      setStatus("เกิดข้อผิดพลาดระหว่างการถอนเงิน");
    }
  };

  // ฝากแบบ time-locked
  const handleTimeLockedDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("กรุณากรอกจำนวนเงินที่ต้องการฝาก");
      return;
    }

    try {
      const contract = await connectMetaMask();
      const value = unit === 'eth' ? ethers.utils.parseEther(amount) : ethers.BigNumber.from(amount); // แปลงหน่วยตามที่เลือก
      await contract.timeLockedDeposit({ value });
      fetchBalance(); // ดึงข้อมูลยอดเงินใหม่
      setStatus("ฝากแบบล็อกเวลาสำเร็จ!");
    } catch (error) {
      console.error(error);
      setStatus("เกิดข้อผิดพลาดระหว่างการฝากแบบล็อกเวลา");
    }
  };

  // ดึงข้อมูล time lock
  const fetchTimeLockInfo = async () => {
    try {
      const contract = await connectMetaMask();
      const [amount, unlockTime] = await contract.getTimeLockInfo();
      setUnlockTime(new Date(unlockTime * 1000).toLocaleString());
    } catch (error) {
      console.error(error);
      setStatus("เกิดข้อผิดพลาดระหว่างการดึงข้อมูลล็อกเวลา");
    }
  };

  useEffect(() => {
    if (account) {
      fetchBalance();
      fetchTimeLockInfo();
    }
  }, [account]);

  return (
    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 min-h-screen flex items-center justify-center">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full sm:min-w-max">
        <h1 className="text-3xl font-semibold text-center text-indigo-700 mb-4">Smart Wallet</h1>
        {account ? (
          <p className="text-lg text-gray-600 mb-2"><strong>กระเป๋า:</strong> {account}</p>
        ) : (
          <button onClick={connectMetaMask} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">เชื่อมต่อกับ MetaMask</button>
        )}
        
        <p className="text-lg text-gray-600 mb-4"><strong>ยอดเงิน:</strong> {balance} {unit.toUpperCase()}</p>

        <div className="flex flex-col gap-4">
          <input
            type="number"
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="จำนวนเงิน"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => setUnit(e.target.value)}
              value={unit}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="eth">ETH</option>
              <option value="wei">WEI</option>
            </select>
            <button onClick={handleDeposit} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">ฝากเงิน</button>
            <button onClick={handleWithdraw} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">ถอนเงิน</button>
            <button onClick={handleTimeLockedDeposit} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">ฝากแบบล็อกเวลา</button>
          </div>
        </div>

        {unlockTime && (
          <p className="text-lg text-gray-600 mt-4"><strong>วันที่ปลดล็อก:</strong> {unlockTime}</p>
        )}

        {status && (
          <p className="text-lg text-red-600 mt-4"><strong>สถานะ:</strong> {status}</p>
        )}
      </div>
    </div>
  );
};

export default SmartWallet;
