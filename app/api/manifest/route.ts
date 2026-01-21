import { NextRequest, NextResponse } from 'next/server';
import { bixAppsConfigs, defaultManifest, BixAppConfig } from '@/lib/bixAppsConfig';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const appParam = searchParams.get('app');

  let manifest: BixAppConfig = { ...defaultManifest };

  if (appParam && bixAppsConfigs[appParam]) {
    const appConfig = bixAppsConfigs[appParam];
    manifest = {
      ...manifest,
      ...appConfig,
      // Ensure icons are preserved or overridden correctly if appConfig had them
      icons: appConfig.icons || manifest.icons, 
    };
  }

  return NextResponse.json(manifest);
}
