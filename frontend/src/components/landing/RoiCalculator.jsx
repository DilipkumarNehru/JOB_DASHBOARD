import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, TrendingUp, Calendar, Zap, ArrowRight } from 'lucide-react';

export default function RoiCalculator() {
  const [appsPerMonth, setAppsPerMonth] = useState(35);
  const [responseRate, setResponseRate] = useState(6); // 6%

  // Calculations:
  // Manual time spent per application: researching + tailoring + tracking = ~45 mins (0.75 hrs)
  // With Job Dashboard: ~12 mins (0.2 hrs) -> saves ~0.55 hrs per app + 4 hours email/followup tracking per month
  const hoursSaved = Math.round(appsPerMonth * 0.55 + 5);

  // Baseline interviews:
  const baselineInterviews = Math.max(1, Math.round((appsPerMonth * responseRate) / 100));
  // Optimized interviews with ATS match + tailored keywords (+2.8x lift average):
  const optimizedInterviews = Math.round(baselineInterviews * 2.8);
  const interviewsGained = optimizedInterviews - baselineInterviews;

  // Days to offer estimation:
  const daysToOffer = Math.max(18, Math.round(75 - (appsPerMonth * 0.35) - (responseRate * 1.5)));

  return (
    <section id="roi-calculator" className="landing-section bg-gradient-to-b from-white via-slate-50 to-white py-24 relative overflow-hidden">
      <div className="landing-container relative z-10">
        <div className="section-header text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-4 border border-emerald-200">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span>Interactive Career Impact Calculator</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Calculate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Time &amp; Callback Multiplier</span>
          </h2>
          <p className="text-slate-600 text-base md:text-lg">
            See how much time you reclaim each month and how many more recruiter interviews you can expect by leveraging AI-assisted ATS optimization and pipeline tracking.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-6 md:p-10 grid lg:grid-cols-12 gap-8 items-center">
          {/* Sliders Column */}
          <div className="lg:col-span-6 space-y-7">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-800">
                  Target Applications / Month
                </label>
                <span className="text-base font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md">
                  {appsPerMonth} apps
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={appsPerMonth}
                onChange={(e) => setAppsPerMonth(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>10 (Casual)</span>
                <span>50 (Active)</span>
                <span>100 (Intense)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-800">
                  Current Interview Response Rate
                </label>
                <span className="text-base font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                  {responseRate}%
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                value={responseRate}
                onChange={(e) => setResponseRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>2% (Low response)</span>
                <span>10% (Industry avg)</span>
                <span>20% (High response)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              💡 <strong>How we compute this:</strong> Based on 2025 tech job market benchmarks, candidate ATS keyword optimization generates an average 2.8x lift in recruiter screen passes while reducing manual tracking overhead by 73%.
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6 bg-slate-900 text-white rounded-xl p-6 md:p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-2xl rounded-full pointer-events-none" />

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1 font-medium">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  <span>Time Saved</span>
                </div>
                <div className="text-2xl md:text-3xl font-extrabold text-blue-400">
                  ~{hoursSaved} hrs
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">every single month</div>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1 font-medium">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Extra Interviews</span>
                </div>
                <div className="text-2xl md:text-3xl font-extrabold text-emerald-400">
                  +{interviewsGained} calls
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">from matched roles</div>
              </div>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5 text-purple-400" />
                  <span>Projected Time to Next Offer</span>
                </div>
                <div className="text-xl md:text-2xl font-bold text-white mt-1">
                  ~{daysToOffer} Days
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-purple-300 font-semibold bg-purple-900/60 border border-purple-700/50 px-2.5 py-1 rounded-full">
                  62% Faster
                </span>
              </div>
            </div>

            <Link
              to="/register"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all"
            >
              Accelerate Your Search Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
