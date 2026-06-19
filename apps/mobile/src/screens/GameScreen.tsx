import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GameBoard } from '../components/GameBoard'
import { SimpleBottomSheet } from '../components/SimpleBottomSheet'
import { GameMenu } from '../components/GameMenu'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigation } from '@react-navigation/native'

export function GameScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<any>()
  const [difficulty, setDifficulty] = useState('easy')
  const [width, setWidth] = useState(9)
  const [height, setHeight] = useState(9)
  const [mineCount, setMineCount] = useState(10)
  const [gameKey, setGameKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const startGame = (diff: string, w?: number, h?: number, mines?: number) => {
    setDifficulty(diff)
    setWidth(w ?? 9)
    setHeight(h ?? 9)
    setMineCount(mines ?? 10)
    setGameKey(k => k + 1)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <GameBoard
        key={gameKey} width={width} height={height} mineCount={mineCount}
        difficulty={difficulty}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenLeaderboard={() => navigation.navigate('Leaderboard')}
        onOpenProfile={() => navigation.navigate('Profile')}
      />
      <SimpleBottomSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <GameMenu
          onClose={() => setMenuOpen(false)}
          onStartGame={startGame}
          onNewGame={() => setGameKey(k => k + 1)}
          currentDifficulty={difficulty}
        />
      </SimpleBottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
