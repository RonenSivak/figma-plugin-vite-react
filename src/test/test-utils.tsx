import React from 'react'
import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import { WixDesignSystemProvider } from '@wix/design-system'

// Custom render function that wraps components with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      {children}
    </WixDesignSystemProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render } 