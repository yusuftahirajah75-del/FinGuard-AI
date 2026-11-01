import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileSearch,
  AlertTriangle,
  BarChart3,
  Sliders,
  ShieldAlert,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    name: 'Overview',
    path: '/',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Transactions',
    path: '/transactions',
    icon: ArrowLeftRight,
    badge: null,
  },
  {
    name: 'Investigation',
    path: '/investigation',
    icon: FileSearch,
    badge: null,
  },
  {
    name: 'Alerts',
    path: '/alerts',
    icon: AlertTriangle,
    badge: null,
  },
  {
    name: 'Detection Analytics',
    path: '/analytics',
    icon: BarChart3,
    badge: null,
  },
  {
    name: 'Methodology & Settings',
    path: '/methodology',
    icon: Sliders,
    badge: null,
  },
];

export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-wider flex items-center gap-1.5 font-mono">
                  FTADS
                  <span className="text-[10px] font-medium text-brand-400 bg-brand-950/80 border border-brand-800/60 px-1.5 py-0.2 rounded">
                    v1.0
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 truncate">Financial Security Ops</p>
              </div>
            </div>
          </div>

          {/* Academic notice badge */}
          <div className="mx-4 my-3 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 text-[11px] text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span>Academic Research Engine</span>
          </div>

          {/* Navigation link list */}
          <nav className="px-3 py-2 space-y-1" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                  end={item.path === '/'}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Analyst / Security Operator area */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-200 truncate">Analyst Station</div>
              <div className="text-[11px] text-slate-400 truncate font-mono">ID: SEC-OP-4492</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
