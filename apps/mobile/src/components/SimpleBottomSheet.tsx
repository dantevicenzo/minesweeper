import { useEffect, useRef, ReactNode } from 'react'
import { View, Text, Modal, Pressable, StyleSheet, Animated, Dimensions } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

interface SimpleBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function SimpleBottomSheet({ isOpen, onClose, title, children }: SimpleBottomSheetProps) {
  const { colors } = useTheme()
  const slideAnim = useRef(new Animated.Value(0)).current
  const { height } = Dimensions.get('window')

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [isOpen, slideAnim])

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  })

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.sheet, { backgroundColor: colors.surface, transform: [{ translateY }] }]}>
          <Pressable onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
    maxHeight: '75%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
})
