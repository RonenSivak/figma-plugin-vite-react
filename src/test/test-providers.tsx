import type { ReactNode } from 'react'
import { WixDesignSystemProvider } from '@wix/design-system'

export const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      {children}
    </WixDesignSystemProvider>
  )
}
