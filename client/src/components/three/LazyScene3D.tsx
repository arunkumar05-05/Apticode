import React, { Suspense, lazy } from 'react';
import type { Scene3DProps } from './Scene3D';

const Scene3D = lazy(() => import('./Scene3D'));

export default function LazyScene3D(props: Scene3DProps) {
  return (
    <Suspense fallback={null}>
      <Scene3D {...props} />
    </Suspense>
  );
}
