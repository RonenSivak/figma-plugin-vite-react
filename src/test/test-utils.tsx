import type { ReactElement } from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import { AllTheProviders } from './test-providers'

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Export commonly used testing utilities
export { screen, waitFor, fireEvent, act }
export { customRender as render }
