import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'
import { useThreads } from '../../src/hooks/useThread'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import { useRegisterExpoPush } from '../../src/hooks/useRegisterExpoPush'

function TabIcon({
  emoji, label, focused, badge,
}: {
  emoji: string
  label: string
  focused: boolean
  badge?: number
}) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <View>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
        {badge != null && badge > 0 && (
          <View style={{
            position: 'absolute', top: -4, right: -10,
            backgroundColor: '#F44336', borderRadius: 8,
            minWidth: 16, height: 16,
            justifyContent: 'center', alignItems: 'center',
            paddingHorizontal: 3,
          }}>
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
              {badge > 99 ? '99+' : String(badge)}
            </Text>
          </View>
        )}
      </View>
      <Text style={{
        fontSize: 10,
        color: focused ? '#D4A843' : '#888888',
        fontWeight: focused ? '600' : '400',
        numberOfLines: 1,
      } as any}>
        {label}
      </Text>
    </View>
  )
}

export default function TabsLayout() {
  const { data: me } = useCurrentUser()
  const { data: threads } = useThreads()

  useRegisterExpoPush(me?.id)

  const totalUnread = threads?.reduce((sum, t) => {
    const isBuyer = t.buyerId === me?.id
    return sum + (isBuyer ? t.buyerUnread : t.sellerUnread)
  }, 0) ?? 0

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarShowLabel: false,
      }}
    >
      {/* ── Visible tabs — left to right on screen (RTL: גילוי … הגדרות) ── */}

      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" label="גילוי" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💬" label="הודעות" focused={focused} badge={totalUnread} />
          ),
        }}
      />

      <Tabs.Screen
        name="swipe"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔥" label="גלילה" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="recommended"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⭐" label="מומלצים" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" label="הגדרות" focused={focused} />
          ),
        }}
      />

      {/* ── Hidden from tab bar — still reachable via router.push ── */}

      <Tabs.Screen
        name="favorites"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{ href: null }}
      />
    </Tabs>
  )
}
