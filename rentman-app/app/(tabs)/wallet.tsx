import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useState, useEffect } from 'react';

interface TokenBalance {
  symbol: string;
  balance: number;
  usdValue: number;
  icon: string;
}

export default function Wallet() {
  const [balance, setBalance] = useState(1240.50);
  const [trend, setTrend] = useState('+12.5%');

  const tokens: TokenBalance[] = [
    { symbol: 'USDG', balance: 840.50, usdValue: 840.50, icon: 'U' },
    { symbol: 'ETH', balance: 0.124, usdValue: 290.00, icon: 'E' },
    { symbol: 'RENT', balance: 45000, usdValue: 110.00, icon: 'R' },
  ];

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar style="light" />
      
      {/* Terminal Nav Header */}
      <View className="bg-black/80 border-b border-[#00ff88]/10 pt-12 pb-3 px-4">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity className="w-10 h-10 items-center justify-center border border-[#00ff88]/20 rounded">
            <MaterialCommunityIcons name="arrow-left" size={20} color="#00ff88" />
          </TouchableOpacity>
          
          <View className="items-center">
            <Text className="text-[#00ff88]/60 font-mono text-[10px] uppercase tracking-widest">
              Terminal_v4.2
            </Text>
            <Text className="text-white font-mono text-sm font-bold tracking-wider">
              WALLET_DASHBOARD
            </Text>
          </View>
          
          <TouchableOpacity className="w-10 h-10 items-center justify-center border border-[#00ff88]/20 rounded">
            <MaterialCommunityIcons name="cog" size={20} color="#00ff88" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Balance Header */}
        <View className="items-center pt-6 pb-4 border-x border-[#00ff88]/10 relative">
          {/* Grid Background */}
          <View className="absolute inset-0 opacity-30" />
          
          <Text className="text-[#00ff88]/60 font-mono text-[10px] uppercase tracking-[0.2em] mb-1">
            Total_Balance_Available
          </Text>
          <Text 
            className="text-[#00ff88] font-mono text-[40px] font-bold leading-none py-2"
            style={{ textShadowColor: 'rgba(0,255,136,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}
          >
            ${balance.toFixed(2)}
          </Text>
          <View className="flex-row items-center gap-2 px-3 py-1 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-full">
            <MaterialCommunityIcons name="trending-up" size={14} color="#00ff88" />
            <Text className="text-[#00ff88] font-mono text-[11px] font-bold">
              {trend} (24H)
            </Text>
          </View>
        </View>

        {/* Earnings Trend HUD */}
        <View className="mx-4 mt-6 border border-[#1a2e25] bg-black/40 rounded-lg overflow-hidden">
          <View className="flex-row items-center justify-between p-3 border-b border-[#1a2e25] bg-[#0d1a14]/50">
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 bg-[#00ff88] rounded-full" />
              <Text className="text-[#00ff88] font-mono text-xs font-bold uppercase tracking-widest">
                Earnings_Trend_HUD
              </Text>
            </View>
            <Text className="text-[#00ff88]/40 font-mono text-[10px] uppercase">
              Live_Feed
            </Text>
          </View>
          
          <View className="p-4">
            <Svg width="100%" height={160} viewBox="0 0 400 150">
              <Defs>
                <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#00ff88" stopOpacity="0.2" />
                  <Stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              
              <Path 
                d="M0,130 Q50,120 80,100 T160,80 T240,40 T320,60 T400,20 V150 H0 Z" 
                fill="url(#lineGradient)" 
              />
              <Path 
                d="M0,130 Q50,120 80,100 T160,80 T240,40 T320,60 T400,20" 
                fill="none" 
                stroke="#00ff88" 
                strokeWidth="2" 
              />
              
              <Rect x="78" y="98" width="4" height="4" fill="#00ff88" />
              <Rect x="158" y="78" width="4" height="4" fill="#00ff88" />
              <Rect x="238" y="38" width="4" height="4" fill="#00ff88" />
              <Rect x="318" y="58" width="4" height="4" fill="#00ff88" />
              <Rect x="396" y="18" width="4" height="4" fill="#00ff88" />
            </Svg>
            
            <View className="flex-row justify-between mt-4 border-t border-[#1a2e25] pt-2">
              <Text className="text-[#00ff88]/40 font-mono text-[9px]">00:00</Text>
              <Text className="text-[#00ff88]/40 font-mono text-[9px]">06:00</Text>
              <Text className="text-[#00ff88]/40 font-mono text-[9px]">12:00</Text>
              <Text className="text-[#00ff88]/40 font-mono text-[9px]">18:00</Text>
              <Text className="text-[#00ff88]/40 font-mono text-[9px]">NOW</Text>
            </View>
          </View>
        </View>

        {/* Token Breakdown */}
        <View className="mx-4 mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialCommunityIcons name="circle-multiple" size={14} color="#00ff88" />
            <Text className="text-white font-mono text-xs font-bold uppercase tracking-widest">
              Token_Breakdown
            </Text>
          </View>
          
          <View className="border border-[#1a2e25] rounded overflow-hidden">
            {/* Table Header */}
            <View className="bg-[#0d1a14] border-b border-[#1a2e25] flex-row p-3">
              <Text className="text-[#00ff88]/60 font-mono text-[10px] uppercase font-medium flex-1">
                Asset
              </Text>
              <Text className="text-[#00ff88]/60 font-mono text-[10px] uppercase font-medium w-24 text-right">
                Balance
              </Text>
              <Text className="text-[#00ff88]/60 font-mono text-[10px] uppercase font-medium w-20 text-right">
                USD_Val
              </Text>
            </View>
            
            {/* Table Body */}
            {tokens.map((token, index) => (
              <View 
                key={token.symbol}
                className={`flex-row p-3 ${index < tokens.length - 1 ? 'border-b border-[#1a2e25]' : ''}`}
              >
                <View className="flex-row items-center gap-2 flex-1">
                  <View className="w-6 h-6 bg-[#00ff88]/20 rounded items-center justify-center">
                    <Text className="text-[#00ff88] font-bold text-[10px]">{token.icon}</Text>
                  </View>
                  <Text className="text-white font-mono text-xs">{token.symbol}</Text>
                </View>
                <Text className="text-white font-mono text-xs w-24 text-right">
                  {token.balance.toLocaleString()}
                </Text>
                <Text className="text-[#00ff88] font-mono text-xs w-20 text-right">
                  ${token.usdValue.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mx-4 mt-6">
          <TouchableOpacity 
            className="flex-1 bg-[#00ff88] py-4 rounded flex-row items-center justify-center gap-2 active:scale-95"
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="call-made" size={20} color="black" />
            <Text className="text-black font-mono font-bold">WITHDRAW</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 border border-[#00ff88] bg-[#00ff88]/5 py-4 rounded flex-row items-center justify-center gap-2 active:scale-95"
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="call-received" size={20} color="#00ff88" />
            <Text className="text-[#00ff88] font-mono font-bold">DEPOSIT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
