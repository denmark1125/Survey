import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface Props {
  onLogin: () => void;
  onBack: () => void;
}

const Login: React.FC<Props> = ({ onLogin, onBack }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '8888') { // Default password
      onLogin();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-200 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-morandi-pink/30 rounded-full flex items-center justify-center mx-auto mb-6 text-morandi-dark">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">老師登入</h2>
        <p className="text-gray-500 mb-6 text-sm">請輸入後台管理密碼</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-morandi-blue outline-none transition-colors text-center text-lg tracking-widest"
            placeholder="••••"
            autoFocus
          />
          {error && <p className="text-red-400 text-xs font-bold animate-pulse">密碼錯誤，請重試</p>}
          
          <button
            type="submit"
            className="w-full py-3 bg-morandi-dark text-white rounded-xl font-bold hover:bg-gray-700 transition-colors shadow-lg shadow-gray-200"
          >
            登入系統
          </button>
        </form>
        
        <button onClick={onBack} className="mt-6 text-gray-400 text-sm hover:text-gray-600">
          回首頁
        </button>
      </div>
    </div>
  );
};

export default Login;