'use client';

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useTradeStore } from '@/stores/tradeStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Download, Twitter, Copy, Check, TrendingUp, TrendingDown } from 'lucide-react';

export function SharePnLCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { analytics } = useTradeStore();

  if (!analytics) return null;

  const generateImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to generate image:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `deriverse-pnl-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleCopyImage = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    try {
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy image:', error);
    }
  };

  const handleShareToTwitter = async () => {
    const pnlText = analytics.totalPnL >= 0 ? `+$${analytics.totalPnL.toLocaleString()}` : `-$${Math.abs(analytics.totalPnL).toLocaleString()}`;
    const winRate = analytics.winRate.toFixed(1);
    const text = `📊 My Trading Performance on @DeriverseXYZ\n\n💰 Total PnL: ${pnlText}\n🎯 Win Rate: ${winRate}%\n📈 ${analytics.totalTrades} Trades\n\n#Deriverse #Solana #Trading`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank');
  };

  const formatValue = (value: number, includeSign = true) => {
    const absValue = Math.abs(value);
    const formatted = absValue >= 1000
      ? `$${(absValue / 1000).toFixed(1)}k`
      : `$${absValue.toFixed(2)}`;
    if (!includeSign) return formatted;
    return value >= 0 ? `+${formatted}` : `-${formatted.replace('$', '')}`;
  };

  const isProfitable = analytics.totalPnL >= 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share PnL
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your PnL</DialogTitle>
        </DialogHeader>

        {/* Shareable Card */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-xl p-6"
          style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-bold">Deriverse</span>
            </div>
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Main PnL */}
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-1">Total PnL</p>
            <div className="flex items-center justify-center gap-2">
              {isProfitable ? (
                <TrendingUp className="h-6 w-6 text-green-500" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-500" />
              )}
              <span className={`text-4xl font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                {formatValue(analytics.totalPnL)}
              </span>
            </div>
            <p className={`text-sm mt-1 ${isProfitable ? 'text-green-500/70' : 'text-red-500/70'}`}>
              {analytics.totalPnLPercent >= 0 ? '+' : ''}{analytics.totalPnLPercent.toFixed(2)}%
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-gray-400 text-xs">Win Rate</p>
              <p className={`text-lg font-bold ${analytics.winRate >= 50 ? 'text-green-500' : 'text-yellow-500'}`}>
                {analytics.winRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-gray-400 text-xs">Trades</p>
              <p className="text-lg font-bold text-white">{analytics.totalTrades}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-gray-400 text-xs">Profit Factor</p>
              <p className={`text-lg font-bold ${analytics.profitFactor >= 1 ? 'text-green-500' : 'text-red-500'}`}>
                {analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-xs text-gray-500">Built on Solana</span>
            <span className="text-xs text-gray-500">deriverse.xyz</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            onClick={handleCopyImage}
            disabled={isGenerating}
            variant="outline"
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            onClick={handleShareToTwitter}
            variant="outline"
            className="gap-2"
          >
            <Twitter className="h-4 w-4" />
            Tweet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
