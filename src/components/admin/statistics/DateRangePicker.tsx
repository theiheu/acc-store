"use client";

import { useState, useRef, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay, isValid } from 'date-fns';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  disabled?: boolean;
}

// Predefined date ranges
const PRESET_RANGES = [
  {
    key: 'today',
    label: 'Hôm nay',
    getValue: () => ({
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date()),
      label: 'Hôm nay',
    }),
  },
  {
    key: 'yesterday',
    label: 'Hôm qua',
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
        label: 'Hôm qua',
      };
    },
  },
  {
    key: 'last7days',
    label: '7 ngày qua',
    getValue: () => ({
      startDate: startOfDay(subDays(new Date(), 6)),
      endDate: endOfDay(new Date()),
      label: '7 ngày qua',
    }),
  },
  {
    key: 'last30days',
    label: '30 ngày qua',
    getValue: () => ({
      startDate: startOfDay(subDays(new Date(), 29)),
      endDate: endOfDay(new Date()),
      label: '30 ngày qua',
    }),
  },
  {
    key: 'last90days',
    label: '3 tháng qua',
    getValue: () => ({
      startDate: startOfDay(subDays(new Date(), 89)),
      endDate: endOfDay(new Date()),
      label: '3 tháng qua',
    }),
  },
  {
    key: 'last365days',
    label: '1 năm qua',
    getValue: () => ({
      startDate: startOfDay(subDays(new Date(), 364)),
      endDate: endOfDay(new Date()),
      label: '1 năm qua',
    }),
  },
];

export default function DateRangePicker({
  value,
  onChange,
  className = "",
  disabled = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(
    format(value.startDate, 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState(
    format(value.endDate, 'yyyy-MM-dd')
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetSelect = (preset: typeof PRESET_RANGES[0]) => {
    const range = preset.getValue();
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomDateChange = () => {
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);

    if (isValid(startDate) && isValid(endDate) && startDate <= endDate) {
      const range: DateRange = {
        startDate: startOfDay(startDate),
        endDate: endOfDay(endDate),
        label: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
      };
      onChange(range);
      setIsOpen(false);
    }
  };

  const formatDisplayValue = (range: DateRange) => {
    if (range.label !== 'Tùy chỉnh') {
      return range.label;
    }
    return `${format(range.startDate, 'dd/MM/yyyy')} - ${format(range.endDate, 'dd/MM/yyyy')}`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full px-3 py-2 text-left
          border border-gray-300 dark:border-gray-600 rounded-lg
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          focus:ring-2 focus:ring-amber-500 focus:border-transparent
          transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}
        `}
      >
        <span className="truncate">{formatDisplayValue(value)}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-80 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Chọn khoảng thời gian
            </h4>
            
            {/* Preset ranges */}
            <div className="space-y-1 mb-4">
              {PRESET_RANGES.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePresetSelect(preset)}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Tùy chỉnh
              </h5>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={handleCustomDateChange}
                className="w-full px-3 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
