import React from 'react';

type QuantisLogoSize = 'sm' | 'md' | 'lg';

interface QuantisLogoProps {
  className?: string;
  size?: QuantisLogoSize;
  showVersion?: boolean;
  version?: string;
  muted?: boolean;
}

const sizeStyles: Record<QuantisLogoSize, {
  text: string;
  mark: string;
  slot: string;
  candleWick: string;
  candleBody: string;
  strike: string;
  badge: string;
  badgeLabel: string;
  badgeGap: string;
}> = {
  sm: {
    text: 'text-[1.45rem]',
    mark: 'pb-2.5',
    slot: 'w-[0.45em] mx-[0.035em]',
    candleWick: 'h-[1.08em] w-[3px]',
    candleBody: 'h-[0.5em] w-[0.34em] border-2 shadow-[2px_2px_0_#111]',
    strike: 'bottom-1 h-[8px] border-2',
    badge: 'text-[8px] px-1.5 py-0.5 border-2 shadow-[2px_2px_0_#111]',
    badgeLabel: 'text-[7px] px-1.5 py-0.5',
    badgeGap: '-space-y-0.5 mb-2.5'
  },
  md: {
    text: 'text-[2rem]',
    mark: 'pb-3.5',
    slot: 'w-[0.46em] mx-[0.04em]',
    candleWick: 'h-[1.08em] w-[4px]',
    candleBody: 'h-[0.52em] w-[0.36em] border-[3px] shadow-[3px_3px_0_#111]',
    strike: 'bottom-1 h-[12px] border-2',
    badge: 'text-[10px] px-2 py-1 border-2 shadow-[2px_2px_0_#111]',
    badgeLabel: 'text-[9px] px-2 py-0.5',
    badgeGap: '-space-y-1 mb-3'
  },
  lg: {
    text: 'text-5xl md:text-6xl',
    mark: 'pb-5',
    slot: 'w-[0.46em] mx-[0.045em]',
    candleWick: 'h-[1.08em] w-[5px]',
    candleBody: 'h-[0.52em] w-[0.36em] border-4 shadow-[4px_4px_0_#111]',
    strike: 'bottom-1.5 h-[18px] border-[3px]',
    badge: 'text-xs px-3 py-1.5 border-[3px] shadow-[3px_3px_0_#111]',
    badgeLabel: 'text-[11px] px-3 py-1',
    badgeGap: '-space-y-1.5 mb-4'
  }
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function QuantisLogo({
  className,
  size = 'md',
  showVersion = false,
  version = 'v0.42',
  muted = false
}: QuantisLogoProps) {
  const styles = sizeStyles[size];

  return (
    <div
      aria-label="Quantis"
      className={cx(
        'group inline-flex items-end gap-5 select-none',
        muted ? 'opacity-90' : '',
        className
      )}
    >
      <div className={cx('relative flex items-center', styles.mark)}>
        <div
          className={cx(
            'absolute left-0 right-0 bg-primary border-ink -rotate-1 transition-transform duration-200 group-hover:-rotate-2 group-hover:translate-x-1',
            styles.strike
          )}
        />

        <h1
          className={cx(
            'relative flex items-center font-[1000] italic uppercase tracking-[-0.11em] leading-none text-ink',
            styles.text
          )}
        >
          <span>QUANT</span>
          <span className={cx('relative inline-flex shrink-0 items-center justify-center self-stretch', styles.slot)}>
            <span className={cx('block bg-ink', styles.candleWick)} />
            <span
              className={cx(
                'absolute bg-chalk border-ink transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5',
                styles.candleBody
              )}
            />
          </span>
          <span>S</span>
        </h1>
      </div>

      {showVersion ? (
        <div className={cx('flex shrink-0 flex-col transition-transform duration-200 group-hover:-translate-y-0.5', styles.badgeGap)}>
          <span className={cx('w-fit bg-ink text-primary font-black uppercase tracking-[0.2em] leading-none', styles.badgeLabel)}>
            Simulator
          </span>
          <span
            className={cx(
              'w-fit bg-chalk text-ink border-ink font-black uppercase tracking-[0.2em] leading-none',
              styles.badge
            )}
          >
            {version}
          </span>
        </div>
      ) : null}
    </div>
  );
}
