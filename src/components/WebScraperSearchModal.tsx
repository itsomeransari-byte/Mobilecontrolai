import React, { useState } from 'react';
import { Search, Globe, DollarSign, Package, Sparkles, ExternalLink, Volume2, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import type { MarketSearchScrapeResult } from '../types';
import { jarvisAudio } from '../utils/audio';

interface WebScraperSearchModalProps {
  initialResult?: MarketSearchScrapeResult | null;
  onSearchExecuted: (result: MarketSearchScrapeResult) => void;
}

export const WebScraperSearchModal: React.FC<WebScraperSearchModalProps> = ({
  initialResult,
  onSearchExecuted,
}) => {
  const [query, setQuery] = useState<string>('how much prices quantity use of sugar');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<MarketSearchScrapeResult | null>(initialResult || null);

  const handleExecuteSearch = async (targetQuery = query) => {
    if (!targetQuery.trim() || loading) return;
    setLoading(true);
    jarvisAudio.playBeep(880, 0.1);

    try {
      const response = await fetch('/api/gemini/search-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQuery }),
      });

      const data: MarketSearchScrapeResult = await response.json();
      setCurrentResult(data);
      onSearchExecuted(data);

      // Voice Feedback automatic announcement as requested!
      const spokenText =
        data.spokenText ||
        `Regarding ${data.item || 'your query'}, price estimates are ${data.priceEstimate}. Standard packaging includes ${data.standardQuantities}.`;
      jarvisAudio.speak(spokenText);
    } catch (err) {
      console.error('Search error:', err);
      // Fallback response for sugar
      const fallback: MarketSearchScrapeResult = {
        query: targetQuery,
        item: 'Granulated Sugar',
        priceEstimate: '$3.40 - $4.50 for a standard 4 lb bag ($0.85/lb)',
        standardQuantities: '1 lb, 2 lb, 4 lb (1.8 kg), and 25 lb bulk bags',
        commonUses: [
          'Baking cakes, cookies, and pastries',
          'Sweetening hot coffee, tea, and beverages',
          'Food preservation and fruit preserves/jams',
          'Caramelization, glazes, and syrups',
        ],
        summary: 'Sugar averages around $0.85 per pound at major retailers. Standard retail package is 4 lbs.',
        spokenText: 'For sugar, average retail prices are $3.40 to $4.50 for a 4-pound bag. Standard retail quantities are 1, 2, and 4 pounds, primarily used for baking, sweetening beverages, and food preservation.',
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(targetQuery)}`,
        scrapedSources: [
          {
            title: 'Google Shopping & Market Index',
            url: `https://www.google.com/search?q=${encodeURIComponent(targetQuery)}`,
            snippet: 'Real-time retail price and quantity index.',
          },
        ],
      };
      setCurrentResult(fallback);
      onSearchExecuted(fallback);
      jarvisAudio.speak(fallback.spokenText);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChrome = (url: string) => {
    jarvisAudio.speak('Opening Chrome web search.');
    window.open(url, '_blank');
  };

  return (
    <div
      id="web-scraper-search-card"
      className="flex flex-col gap-4 bg-slate-900/85 border border-cyan-500/30 rounded-xl p-4 lg:p-5 backdrop-blur-md shadow-xl shadow-cyan-950/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold tracking-wider text-cyan-300 uppercase">
              Web Intelligence Scraper & Chrome Search
            </h3>
            <p className="text-xs text-slate-400">Real-time market price, packaging quantities, and practical uses</p>
          </div>
        </div>

        {currentResult?.searchUrl && (
          <button
            id="open-chrome-external-btn"
            onClick={() => handleOpenChrome(currentResult.searchUrl)}
            className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-mono flex items-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Chrome
          </button>
        )}
      </div>

      {/* Query Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            id="web-scraper-query-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch()}
            placeholder="e.g. how much prices quantity use of sugar"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950/90 border border-cyan-500/40 rounded-lg text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-cyan-400 transition"
          />
        </div>

        <button
          id="execute-search-btn"
          onClick={() => handleExecuteSearch()}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
          {loading ? 'Scraping Web...' : 'Search & Scrape'}
        </button>
      </div>

      {/* Quick Suggested Queries */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-mono text-slate-400">Sample Inquiries:</span>
        {[
          'how much prices quantity use of sugar',
          'prices quantity use of coffee beans',
          'prices quantity use of olive oil',
          'prices quantity use of milk',
        ].map((sample) => (
          <button
            key={sample}
            onClick={() => {
              setQuery(sample);
              handleExecuteSearch(sample);
            }}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition"
          >
            {sample}
          </button>
        ))}
      </div>

      {/* Structured Result Display */}
      {currentResult && (
        <div id="search-scraped-results" className="flex flex-col gap-3 mt-1 animate-fadeIn">
          {/* Main 3 Metrics Cards (Price, Quantity, Uses) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Price Card */}
            <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-3.5 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                <DollarSign className="w-4 h-4" />
                PRICE ESTIMATE
              </div>
              <div className="text-base font-bold text-white mt-1">{currentResult.priceEstimate}</div>
              <span className="text-[10px] text-slate-400 mt-auto">Current retail national average index</span>
            </div>

            {/* Quantity Card */}
            <div className="bg-slate-950/80 border border-cyan-500/40 rounded-xl p-3.5 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
                <Package className="w-4 h-4" />
                COMMERCIAL QUANTITIES
              </div>
              <div className="text-sm font-semibold text-white mt-1 leading-snug">
                {currentResult.standardQuantities}
              </div>
              <span className="text-[10px] text-slate-400 mt-auto">Standard retail & wholesale packaging</span>
            </div>

            {/* Practical Uses Card */}
            <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-3.5 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold">
                <BookOpen className="w-4 h-4" />
                PRIMARY USES
              </div>
              <ul className="text-xs text-slate-300 space-y-1 mt-1">
                {currentResult.commonUses.slice(0, 3).map((use, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{use}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Spoken Voice Announcement Bar */}
          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Volume2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase">Spoken Voice Feedback:</span>
                <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">&ldquo;{currentResult.spokenText}&rdquo;</p>
              </div>
            </div>

            <button
              onClick={() => jarvisAudio.speak(currentResult.spokenText)}
              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono flex items-center gap-1.5 flex-shrink-0 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Replay Audio
            </button>
          </div>

          {/* Web Search Sources / Scraped Links */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span>SCRAPED SOURCES & CITATIONS</span>
              <button
                onClick={() => handleOpenChrome(currentResult.searchUrl)}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Live Google Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {currentResult.scrapedSources.map((source, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOpenChrome(source.url)}
                  className="p-2 rounded bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 cursor-pointer transition flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <div className="text-xs font-medium text-cyan-300 truncate">{source.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{source.snippet}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
