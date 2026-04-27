import React, { useState } from 'react';
import CardBadgeCompany from './cardBadgeCompany';
import CardBadgeProject from './cardBadgeProject';
import CardBadgeTimesheet from './cardBadgeTimesheet';
import CardBadgeDeal from './cardBadgeDeal';
import CardBadge from '@/components/cardBadge';
import { MoveRight } from 'lucide-react';

interface PropsInterface {
  tableid: string;
  recordid: string;
  badges: string[];
}

export default function BadgeManager({ tableid, recordid, badges }: PropsInterface) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!badges || badges.length === 0) return <></>;

  const renderBadge = (badge: string) => {
    const key = `badge-${badge}-${recordid}`;
    switch (badge) {
      case 'company':
      case 'marginality':
        return <CardBadgeCompany key={key} tableid={tableid} recordid={recordid} />;
      case 'project':
        return <CardBadgeProject key={key} tableid={tableid} recordid={recordid} />;
      case 'timesheet':
        return <CardBadgeTimesheet key={key} tableid={tableid} recordid={recordid} />;
      case 'deal':
        return <CardBadgeDeal key={key} tableid={tableid} recordid={recordid} />;
      default:
        return <CardBadge key={key} tableid={tableid} recordid={recordid} />;
    }
  };

  const handleNext = () => setCurrentIndex((i) => (i + 1) % badges.length);
  const handlePrev = () => setCurrentIndex((i) => (i - 1 + badges.length) % badges.length);

  return (
    <div className="flex flex-col items-center gap-2 w-full">

      {/* Riga: freccia sx + badge + freccia dx */}
      <div className="flex items-center gap-2 w-full max-w-4xl mx-auto">

        {badges.length > 1 ? (
          <button
            onClick={handlePrev}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900 transition-all text-base font-medium"
          >
            ‹
          </button>
        ) : <div className="w-8 shrink-0" />}

              <div className="flex-1 min-w-0">
                {renderBadge(badges[currentIndex])}
              </div>

              {badges.length > 1 ? (
          <button
            onClick={handleNext}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900 transition-all text-base font-medium"
          >
            ›
          </button>
        ) : <div className="w-8 shrink-0" />}

      </div>

      {/* Dots */}
      {badges.length > 1 && (
        <div className="flex items-center gap-1.5">
          {badges.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`rounded-full transition-all ${
                i === currentIndex
                  ? 'w-2 h-2 bg-gray-400 scale-110'
                  : 'w-1.5 h-1.5 bg-gray-200 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}

    </div>
  );
}