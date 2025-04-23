import React from 'react';

export function memoWithDebug<T>(Component: T, name?: string): T {
  const Memo = React.memo(Component as any);
  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    Memo.whyDidYouRender = true;
    if (name) {
      // @ts-ignore
      Memo.displayName = name;
    }
  }
  return Memo as T;
}
