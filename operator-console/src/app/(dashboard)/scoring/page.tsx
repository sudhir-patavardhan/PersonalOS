'use client';
import { useState } from 'react';
import { DEFAULT_CONFIG } from '@/lib/scoring';
import type { BrandScoringConfig } from '@/lib/scoring';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_NAMES: Record<string, string> = {
  'dining.grocery': 'Grocery',
  'dining.restaurant': 'Dining Out',
  'shopping.fashion': 'Fashion',
  'shopping.research': 'Smart Shopping',
  'travel.pattern': 'Travel',
  'health.fitness': 'Fitness',
  'finance.banking': 'Banking',
  'entertainment.streaming': 'Entertainment',
};

export default function ScoringPage() {
  const [config, setConfig] = useState<BrandScoringConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'overview' | 'seasonality' | 'cohorts' | 'badges' | 'weights'>('overview');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Brand Scoring</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure brand reputation scoring, seasonality, and badge thresholds</p>
        </div>
        <button onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg w-fit">
        {(['overview', 'weights', 'seasonality', 'cohorts', 'badges'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${activeTab === tab ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewPanel config={config} />}
      {activeTab === 'weights' && <WeightsPanel config={config} setConfig={setConfig} />}
      {activeTab === 'seasonality' && <SeasonalityPanel config={config} setConfig={setConfig} />}
      {activeTab === 'cohorts' && <CohortsPanel config={config} setConfig={setConfig} />}
      {activeTab === 'badges' && <BadgesPanel config={config} setConfig={setConfig} />}
    </div>
  );
}

function OverviewPanel({ config }: { config: BrandScoringConfig }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Base Score Weights</h3>
        <div className="space-y-2">
          <WeightBar label="Claim Rate" value={config.weights.claimRate} color="bg-green-500" />
          <WeightBar label="Bid Fairness" value={config.weights.bidFairness} color="bg-blue-500" />
          <WeightBar label="Escrow Health" value={config.weights.escrowHealth} color="bg-amber-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Cold Start</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Base Score</span>
            <span className="font-medium">{config.coldStart.baseScore}/100</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Graduation Threshold</span>
            <span className="font-medium">{config.coldStart.graduationThreshold} settlements</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Trend Detection</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Multiplier Range</span>
            <span className="font-medium">{config.trend.multiplierMin}x – {config.trend.multiplierMax}x</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Window</span>
            <span className="font-medium">{config.trend.currentDays}d vs {config.trend.baselineDays}d</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Min Settlements</span>
            <span className="font-medium">{config.trend.minBaselineSettlements} baseline / {config.trend.minCurrentSettlements} current</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Score Floor</span>
            <span className="font-medium">{config.trend.floor}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Escrow Health Tiers</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Absolute Floor</span>
            <span className="font-medium">${config.escrowHealth.absoluteFloor}</span>
          </div>
          {config.escrowHealth.tiers.map((tier, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-zinc-500">{tier.minDays}+ days runway</span>
              <span className="font-medium">{tier.score}/100</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Active Cohorts</h3>
        <div className="space-y-2">
          {Object.entries(config.cohorts).map(([name, cohort]) => (
            <div key={name} className="flex justify-between text-sm">
              <span className="text-zinc-500 capitalize">{name}</span>
              <span className="font-medium text-indigo-600">{cohort.boost}x boost</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Badge Thresholds</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-orange-500">Trending</span>
            <span className="font-medium">≥ {config.badges.trending.threshold}x trend</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-emerald-500">Seasonal Pick</span>
            <span className="font-medium">≥ {config.badges.seasonalPick.threshold}x season</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-500">Popular Nearby</span>
            <span className="font-medium">≥ {config.badges.popularNearby.threshold}x geo</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-pink-500">Repeat Favorite</span>
            <span className="font-medium">{config.badges.repeatFavorite.claimsRequired}+ claims / {config.badges.repeatFavorite.windowDays}d</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeightsPanel({ config, setConfig }: { config: BrandScoringConfig; setConfig: (c: BrandScoringConfig) => void }) {
  function setWeight(key: 'claimRate' | 'bidFairness' | 'escrowHealth', value: number) {
    setConfig({ ...config, weights: { ...config.weights, [key]: value } });
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 max-w-lg">
      <h3 className="text-sm font-semibold text-zinc-900 mb-4">Base Score Signal Weights</h3>
      <p className="text-xs text-zinc-500 mb-6">Must sum to 1.0. These determine how much each signal contributes to the base score.</p>
      <div className="space-y-4">
        <SliderInput label="Claim Rate" value={config.weights.claimRate} onChange={v => setWeight('claimRate', v)} />
        <SliderInput label="Bid Fairness" value={config.weights.bidFairness} onChange={v => setWeight('bidFairness', v)} />
        <SliderInput label="Escrow Health" value={config.weights.escrowHealth} onChange={v => setWeight('escrowHealth', v)} />
      </div>
      <div className="mt-4 text-xs text-zinc-500">
        Sum: {(config.weights.claimRate + config.weights.bidFairness + config.weights.escrowHealth).toFixed(2)}
        {Math.abs(config.weights.claimRate + config.weights.bidFairness + config.weights.escrowHealth - 1) > 0.01 && (
          <span className="text-red-500 ml-2">(must equal 1.0)</span>
        )}
      </div>
    </div>
  );
}

function SeasonalityPanel({ config, setConfig }: { config: BrandScoringConfig; setConfig: (c: BrandScoringConfig) => void }) {
  function updateWeight(category: string, month: number, value: number) {
    const newSeasonality = { ...config.seasonality };
    const weights = [...(newSeasonality[category] || Array(12).fill(1.0))];
    weights[month] = value;
    newSeasonality[category] = weights;
    setConfig({ ...config, seasonality: newSeasonality });
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <h3 className="text-sm font-semibold text-zinc-900 mb-1">Seasonality Multipliers</h3>
      <p className="text-xs text-zinc-500 mb-4">Monthly weight per category. 1.0 = neutral, &gt;1.0 = boosted, &lt;1.0 = suppressed.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs text-zinc-500 font-medium pb-2 pr-4">Category</th>
              {MONTHS.map(m => (
                <th key={m} className="text-center text-xs text-zinc-500 font-medium pb-2 px-1 w-14">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(config.seasonality).map(([cat, weights]) => (
              <tr key={cat} className="border-t border-zinc-100">
                <td className="py-2 pr-4 text-xs font-medium text-zinc-700 whitespace-nowrap">{CATEGORY_NAMES[cat] || cat}</td>
                {weights.map((w, i) => (
                  <td key={i} className="py-1 px-0.5">
                    <input type="number" step="0.05" min="0.5" max="2.0"
                      value={w} onChange={e => updateWeight(cat, i, parseFloat(e.target.value) || 1.0)}
                      className={`w-12 text-center text-xs rounded border px-1 py-1 ${w > 1.05 ? 'bg-green-50 border-green-200 text-green-700' : w < 0.95 ? 'bg-red-50 border-red-200 text-red-700' : 'border-zinc-200 text-zinc-600'}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CohortsPanel({ config, setConfig }: { config: BrandScoringConfig; setConfig: (c: BrandScoringConfig) => void }) {
  function updateCohort(name: string, field: 'boost' | 'requires', value: number | string[]) {
    const newCohorts = { ...config.cohorts };
    if (field === 'boost') {
      newCohorts[name] = { ...newCohorts[name], boost: value as number };
    } else {
      newCohorts[name] = { ...newCohorts[name], requires: value as string[] };
    }
    setConfig({ ...config, cohorts: newCohorts });
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <h3 className="text-sm font-semibold text-zinc-900 mb-1">Behavioral Cohorts</h3>
      <p className="text-xs text-zinc-500 mb-4">Souls matching all required consent categories get the boost multiplier when shown offers from brands in those categories.</p>
      <div className="space-y-4">
        {Object.entries(config.cohorts).map(([name, cohort]) => (
          <div key={name} className="border border-zinc-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-zinc-900 capitalize">{name}</h4>
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500">Boost:</label>
                <input type="number" step="0.01" min="1.0" max="1.5"
                  value={cohort.boost} onChange={e => updateCohort(name, 'boost', parseFloat(e.target.value) || 1.0)}
                  className="w-16 text-center text-sm rounded border border-zinc-200 px-2 py-1"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cohort.requires.map(cat => (
                <span key={cat} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                  {CATEGORY_NAMES[cat] || cat}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BadgesPanel({ config, setConfig }: { config: BrandScoringConfig; setConfig: (c: BrandScoringConfig) => void }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 max-w-lg">
      <h3 className="text-sm font-semibold text-zinc-900 mb-1">Badge Thresholds</h3>
      <p className="text-xs text-zinc-500 mb-4">Configure when each badge is awarded. Priority: Trending &gt; Seasonal Pick &gt; Popular Nearby &gt; Repeat Favorite.</p>
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <span className="text-orange-500">🔥</span> Trending
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 w-32">Trend multiplier ≥</span>
            <input type="number" step="0.05" min="1.0" max="1.5"
              value={config.badges.trending.threshold}
              onChange={e => setConfig({ ...config, badges: { ...config.badges, trending: { threshold: parseFloat(e.target.value) || 1.1 } } })}
              className="w-20 text-sm rounded border border-zinc-200 px-2 py-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <span className="text-emerald-500">🌿</span> Seasonal Pick
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 w-32">Seasonality ≥</span>
            <input type="number" step="0.05" min="1.0" max="2.0"
              value={config.badges.seasonalPick.threshold}
              onChange={e => setConfig({ ...config, badges: { ...config.badges, seasonalPick: { threshold: parseFloat(e.target.value) || 1.15 } } })}
              className="w-20 text-sm rounded border border-zinc-200 px-2 py-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <span className="text-blue-500">📍</span> Popular Nearby
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 w-32">Geo multiplier ≥</span>
            <input type="number" step="0.05" min="1.0" max="1.5"
              value={config.badges.popularNearby.threshold}
              onChange={e => setConfig({ ...config, badges: { ...config.badges, popularNearby: { ...config.badges.popularNearby, threshold: parseFloat(e.target.value) || 1.1 } } })}
              className="w-20 text-sm rounded border border-zinc-200 px-2 py-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <span className="text-pink-500">💜</span> Repeat Favorite
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Claims ≥</span>
              <input type="number" step="1" min="2" max="10"
                value={config.badges.repeatFavorite.claimsRequired}
                onChange={e => setConfig({ ...config, badges: { ...config.badges, repeatFavorite: { ...config.badges.repeatFavorite, claimsRequired: parseInt(e.target.value) || 3 } } })}
                className="w-16 text-sm rounded border border-zinc-200 px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">in</span>
              <input type="number" step="1" min="7" max="90"
                value={config.badges.repeatFavorite.windowDays}
                onChange={e => setConfig({ ...config, badges: { ...config.badges, repeatFavorite: { ...config.badges.repeatFavorite, windowDays: parseInt(e.target.value) || 30 } } })}
                className="w-16 text-sm rounded border border-zinc-200 px-2 py-1"
              />
              <span className="text-xs text-zinc-500">days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeightBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-600 w-24">{label}</span>
      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 100}%` }} />
      </div>
      <span className="text-xs font-medium text-zinc-700 w-8 text-right">{Math.round(value * 100)}%</span>
    </div>
  );
}

function SliderInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <label className="text-sm text-zinc-700">{label}</label>
        <span className="text-sm font-medium text-zinc-900">{Math.round(value * 100)}%</span>
      </div>
      <input type="range" min="0" max="100" value={Math.round(value * 100)}
        onChange={e => onChange(parseInt(e.target.value) / 100)}
        className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
    </div>
  );
}
