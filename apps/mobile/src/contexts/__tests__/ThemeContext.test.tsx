import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { ThemeProvider, useTheme } from '../ThemeContext'
import { Text, Button } from 'react-native'

function TestComponent() {
  const { theme, toggleTheme, colors } = useTheme()
  return (
    <>
      <Text testID="theme">{theme}</Text>
      <Text testID="bg">{colors.bg}</Text>
      <Button title="Toggle" onPress={toggleTheme} />
    </>
  )
}

describe('ThemeContext', () => {
  it('provides light theme by default', () => {
    render(<ThemeProvider><TestComponent /></ThemeProvider>)
    expect(screen.getByTestId('theme').children[0]).toBe('light')
  })
})
