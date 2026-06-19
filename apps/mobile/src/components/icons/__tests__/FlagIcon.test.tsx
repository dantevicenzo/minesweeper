import React from 'react'
import { render } from '@testing-library/react-native'
import { FlagIcon } from '../FlagIcon'

describe('FlagIcon', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<FlagIcon testID="flag-icon" />)
    expect(getByTestId('flag-icon')).toBeTruthy()
  })

  it('renders with custom size', () => {
    const { getByTestId } = render(<FlagIcon width={28} height={36} testID="flag-icon" />)
    const svg = getByTestId('flag-icon')
    expect(svg).toBeTruthy()
  })
})
