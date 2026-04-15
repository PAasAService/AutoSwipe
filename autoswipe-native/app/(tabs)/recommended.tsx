import React, { useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  Dimensions,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { hrefWithReturn } from '../../src/lib/go-back-safe'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import Skeleton from '../../src/components/ui/Skeleton'
import {
  SERVICE_CATEGORIES,
  OFFICIAL_LINKS,
  DOCUMENT_ITEMS,
  GUIDE_ITEMS,
  GADGET_ITEMS,
  ServiceCategory,
  ServiceItem,
  OfficialLink,
  DocumentItem,
  GuideItem,
  GadgetItem,
} from '../../src/data/recommended'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isNewGuide(publishedAt: string): boolean {
  const published = new Date(publishedAt).getTime()
  const now = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return now - published < sevenDays
}

function openUrl(url: string) {
  Linking.openURL(url).catch(() => {
    // silently fail — URL not yet live
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#F5F5F5' }}>{title}</Text>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <Text style={{ color: '#666666', fontSize: 12, textAlign: 'right', marginTop: 2 }}>{subtitle}</Text>
    </View>
  )
}

function ComingSoonPill() {
  return (
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      alignSelf: 'flex-start',
    }}>
      <Text style={{ color: '#666', fontSize: 10, fontWeight: '600' }}>בקרוב</Text>
    </View>
  )
}

function NewBadge() {
  return (
    <View style={{
      backgroundColor: '#D4A843',
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
      alignSelf: 'flex-start',
    }}>
      <Text style={{ color: '#0F0F0F', fontSize: 10, fontWeight: '800' }}>חדש</Text>
    </View>
  )
}

function AffiliateBadge() {
  return (
    <View style={{
      backgroundColor: 'rgba(212,168,67,0.12)',
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
      alignSelf: 'flex-start',
    }}>
      <Text style={{ color: '#D4A843', fontSize: 9, fontWeight: '600' }}>שותפות*</Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Services
// ─────────────────────────────────────────────────────────────────────────────

function ServiceItemRow({ item }: { item: ServiceItem }) {
  return (
    <TouchableOpacity
      onPress={() => !item.isComingSoon && openUrl(item.url)}
      activeOpacity={item.isComingSoon ? 1 : 0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: item.isComingSoon ? 'rgba(255,255,255,0.02)' : '#1A1A1A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        marginBottom: 8,
        opacity: item.isComingSoon ? 0.6 : 1,
      }}
    >
      {/* Right side: text */}
      <View style={{ flex: 1, alignItems: 'flex-end', marginLeft: 8 }}>
        <Text style={{ color: '#F5F5F5', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
          {item.name}
        </Text>
        <Text style={{ color: '#888', fontSize: 11, textAlign: 'right' }}>{item.description}</Text>
        <View style={{ marginTop: 4 }}>
          {item.isComingSoon ? (
            <ComingSoonPill />
          ) : item.isAffiliate ? (
            <AffiliateBadge />
          ) : null}
        </View>
      </View>

      {/* Left side: emoji logo + arrow */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 11, color: '#555' }}>{'<'}</Text>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: '#252525',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 20 }}>{item.logoEmoji}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

function ServiceCategoryBlock({ category }: { category: ServiceCategory }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 8 }}>
        <Text style={{ color: '#AAAAAA', fontSize: 13, fontWeight: '700' }}>{category.title}</Text>
        <Text style={{ fontSize: 16 }}>{category.icon}</Text>
      </View>
      {category.items.map((item) => (
        <ServiceItemRow key={item.id} item={item} />
      ))}
    </View>
  )
}

function ServicesSection({ categories }: { categories: ServiceCategory[] }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <SectionHeader
        icon="🏪"
        title="שירותים"
        subtitle="ספקים ושותפים שנבדקו — הכל ממקום אחד"
      />
      {categories.map((cat) => (
        <ServiceCategoryBlock key={cat.id} category={cat} />
      ))}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Official Links
// ─────────────────────────────────────────────────────────────────────────────

function OfficialLinkCard({ link }: { link: OfficialLink }) {
  return (
    <TouchableOpacity
      onPress={() => !link.isComingSoon && openUrl(link.url)}
      activeOpacity={link.isComingSoon ? 1 : 0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        marginBottom: 8,
        opacity: link.isComingSoon ? 0.5 : 1,
      }}
    >
      <Text style={{ fontSize: 11, color: '#555' }}>{'<'}</Text>
      <View style={{ flex: 1, alignItems: 'flex-end', marginHorizontal: 10 }}>
        <Text style={{ color: '#F5F5F5', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
          {link.title}
        </Text>
        <Text style={{ color: '#888', fontSize: 11, textAlign: 'right' }}>{link.description}</Text>
        {link.isComingSoon && (
          <View style={{ marginTop: 5 }}>
            <ComingSoonPill />
          </View>
        )}
      </View>
      <Text style={{ fontSize: 22 }}>{link.icon}</Text>
    </TouchableOpacity>
  )
}

function OfficialLinksSection() {
  return (
    <View style={{ marginBottom: 28 }}>
      <SectionHeader
        icon="🏛️"
        title="קישורים רשמיים"
        subtitle="ממשלה, רשויות ובדיקות בלי להתאמץ"
      />
      {OFFICIAL_LINKS.map((link) => (
        <OfficialLinkCard key={link.id} link={link} />
      ))}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Documents
// ─────────────────────────────────────────────────────────────────────────────

function DocumentCard({ doc }: { doc: DocumentItem }) {
  function handlePress() {
    if (doc.isComingSoon) return
    openUrl(doc.url)
  }

  async function handleShare() {
    if (doc.isComingSoon) return
    try {
      await Share.share({ message: `${doc.title}\n${doc.url}` })
    } catch {}
  }

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
      backgroundColor: '#1A1A1A',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.07)',
      marginBottom: 8,
      opacity: doc.isComingSoon ? 0.55 : 1,
    }}>
      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TouchableOpacity
          onPress={handleShare}
          disabled={doc.isComingSoon}
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: 7,
          }}
        >
          <Text style={{ fontSize: 14 }}>🔗</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handlePress}
          disabled={doc.isComingSoon}
          style={{
            backgroundColor: doc.isComingSoon ? 'rgba(255,255,255,0.04)' : 'rgba(212,168,67,0.15)',
            borderRadius: 8,
            padding: 7,
          }}
        >
          <Text style={{ fontSize: 14 }}>{doc.isComingSoon ? '🔒' : '⬇️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Text */}
      <View style={{ flex: 1, alignItems: 'flex-end', marginHorizontal: 10 }}>
        <Text style={{ color: '#F5F5F5', fontSize: 14, fontWeight: '600', marginBottom: 3 }}>
          {doc.title}
        </Text>
        <Text style={{ color: '#888', fontSize: 11, textAlign: 'right' }}>{doc.description}</Text>
        {doc.isComingSoon && (
          <View style={{ marginTop: 5 }}>
            <ComingSoonPill />
          </View>
        )}
      </View>

      {/* Icon */}
      <Text style={{ fontSize: 28, marginLeft: 4 }}>{doc.icon}</Text>
    </View>
  )
}

function DocumentsSection() {
  return (
    <View style={{ marginBottom: 28 }}>
      <SectionHeader
        icon="📁"
        title="מסמכים ומדריכים"
        subtitle="PDF להורדה — צ\'קליסטים שיחסכו לך כסף"
      />
      {DOCUMENT_ITEMS.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} />
      ))}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Guides
// ─────────────────────────────────────────────────────────────────────────────

function GuideCard({ guide }: { guide: GuideItem }) {
  const isNew = isNewGuide(guide.publishedAt)
  const router = useRouter()

  function handlePress() {
    if (guide.isComingSoon) return
    if (guide.content) {
      router.push(hrefWithReturn(`/guide/${guide.id}`, 'recommended'))
    } else {
      openUrl(guide.url)
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={guide.isComingSoon ? 1 : 0.78}
      style={{
        padding: 14,
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isNew ? 'rgba(212,168,67,0.3)' : 'rgba(255,255,255,0.07)',
        marginBottom: 10,
        opacity: guide.isComingSoon ? 0.5 : 1,
      }}
    >
      {/* Top row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 10 }}>
        {/* Text */}
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {isNew && <NewBadge />}
            {guide.isComingSoon && <ComingSoonPill />}
            <Text style={{ color: '#F5F5F5', fontSize: 14, fontWeight: '700', textAlign: 'right' }}>
              {guide.title}
            </Text>
          </View>
          <Text style={{ color: '#888', fontSize: 12, textAlign: 'right', lineHeight: 17 }}>
            {guide.subtitle}
          </Text>
        </View>

        {/* Emoji */}
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: '#252525',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 22 }}>{guide.emoji}</Text>
        </View>
      </View>

      {/* Bottom row */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, alignItems: 'center', gap: 6 }}>
        <Text style={{ color: '#555', fontSize: 11 }}>{guide.readMinutes} דק׳ קריאה</Text>
        <Text style={{ color: '#555', fontSize: 11 }}>•</Text>
        <Text style={{ color: guide.isComingSoon ? '#444' : '#D4A843', fontSize: 11, fontWeight: '600' }}>
          {guide.isComingSoon ? 'בקרוב' : 'קרא עוד →'}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

function GuidesSection({ guides }: { guides: GuideItem[] }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <SectionHeader
        icon="📚"
        title="מדריכים"
        subtitle="תוכן שנכתב לרוכשים ומוכרים ישראלים"
      />
      {guides.map((guide) => (
        <GuideCard key={guide.id} guide={guide} />
      ))}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Gadgets
// ─────────────────────────────────────────────────────────────────────────────

function GadgetCard({ gadget }: { gadget: GadgetItem }) {
  return (
    <TouchableOpacity
      onPress={() => !gadget.isComingSoon && openUrl(gadget.url)}
      activeOpacity={gadget.isComingSoon ? 1 : 0.78}
      style={{
        width: (SCREEN_WIDTH - 48) / 2,
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        padding: 12,
        marginBottom: 8,
        opacity: gadget.isComingSoon ? 0.5 : 1,
      }}
    >
      {/* Emoji icon */}
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#252525',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginBottom: 10,
      }}>
        <Text style={{ fontSize: 26 }}>{gadget.emoji}</Text>
      </View>

      {/* Title */}
      <Text
        style={{ color: '#F5F5F5', fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}
        numberOfLines={2}
      >
        {gadget.title}
      </Text>

      {/* Description */}
      <Text
        style={{ color: '#666', fontSize: 10, textAlign: 'right', marginBottom: 8, lineHeight: 15 }}
        numberOfLines={3}
      >
        {gadget.description}
      </Text>

      {/* Footer */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {gadget.isComingSoon ? (
          <ComingSoonPill />
        ) : (
          <View style={{
            backgroundColor: 'rgba(212,168,67,0.15)',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}>
            <Text style={{ color: '#D4A843', fontSize: 11, fontWeight: '700' }}>{'< הצג'}</Text>
          </View>
        )}
        <Text style={{ color: gadget.isComingSoon ? '#444' : '#D4A843', fontSize: 13, fontWeight: '800' }}>
          {gadget.price}
        </Text>
      </View>

      {gadget.isAffiliate && !gadget.isComingSoon && (
        <View style={{ marginTop: 6 }}>
          <AffiliateBadge />
        </View>
      )}
    </TouchableOpacity>
  )
}

function GadgetsSection() {
  const pairs: GadgetItem[][] = []
  for (let i = 0; i < GADGET_ITEMS.length; i += 2) {
    pairs.push(GADGET_ITEMS.slice(i, i + 2))
  }

  return (
    <View style={{ marginBottom: 28 }}>
      <SectionHeader
        icon="🛍️"
        title="גאדג׳טים לרכב"
        subtitle="ציוד שממליצים עליו — חלק מקושר לשותפות*"
      />
      {pairs.map((pair, idx) => (
        <View key={idx} style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
          {pair[1] && <GadgetCard gadget={pair[1]} />}
          {pair[0] && <GadgetCard gadget={pair[0]} />}
        </View>
      ))}
      <Text style={{ color: '#444', fontSize: 10, textAlign: 'right', marginTop: 4 }}>
        * קישורי שותפות — לא משנה את המחיר עבורך
      </Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton loading state
// ─────────────────────────────────────────────────────────────────────────────

function RecommendedSkeleton() {
  const rowW = SCREEN_WIDTH - 32
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} scrollEnabled={false}>
      {/* Section header skeleton */}
      <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
        <Skeleton width={140} height={22} borderRadius={8} />
        <View style={{ marginTop: 6 }}>
          <Skeleton width={220} height={14} borderRadius={6} />
        </View>
      </View>
      {/* Service rows */}
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} width={rowW} height={70} borderRadius={12} style={{ marginBottom: 8 }} />
      ))}
      <View style={{ height: 24 }} />
      {/* Second section */}
      <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
        <Skeleton width={160} height={22} borderRadius={8} />
        <View style={{ marginTop: 6 }}>
          <Skeleton width={200} height={14} borderRadius={6} />
        </View>
      </View>
      {[1, 2].map((i) => (
        <Skeleton key={i} width={rowW} height={60} borderRadius={12} style={{ marginBottom: 8 }} />
      ))}
    </ScrollView>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function RecommendedScreen() {
  const { data: me, isLoading } = useCurrentUser()

  // Personalization: sellers see Services first, buyers see Guides first
  const isSeller = me?.roles?.includes('SELLER') ?? false

  // Guide order: new ones first, then by publishedAt descending
  const sortedGuides = useMemo(() => {
    return [...GUIDE_ITEMS].sort((a, b) => {
      const aNew = isNewGuide(a.publishedAt) ? 1 : 0
      const bNew = isNewGuide(b.publishedAt) ? 1 : 0
      if (bNew !== aNew) return bNew - aNew
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })
  }, [])

  const newGuideCount = sortedGuides.filter((g) => isNewGuide(g.publishedAt)).length

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#F5F5F5', textAlign: 'right' }}>
              ממולץ
            </Text>
            {newGuideCount > 0 && (
              <View style={{
                position: 'absolute',
                top: -4,
                left: -10,
                backgroundColor: '#D4A843',
                borderRadius: 8,
                minWidth: 18,
                height: 18,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 4,
              }}>
                <Text style={{ color: '#0F0F0F', fontSize: 10, fontWeight: '800' }}>{newGuideCount}</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 28 }}>⭐</Text>
        </View>
        <Text style={{ color: '#666', fontSize: 12, textAlign: 'right', marginTop: 2 }}>
          {isSeller ? 'כאן תוכלו למצוא את ההמלצות הכי שוות שלנו' : 'הכל שצריך לדעת לפני שקונים'}
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <RecommendedSkeleton />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Section order based on role */}
          {isSeller ? (
            <>
              <ServicesSection categories={SERVICE_CATEGORIES} />
              <GuidesSection guides={sortedGuides} />
              <OfficialLinksSection />
              <DocumentsSection />
              <GadgetsSection />
            </>
          ) : (
            <>
              <GuidesSection guides={sortedGuides} />
              <ServicesSection categories={SERVICE_CATEGORIES} />
              <OfficialLinksSection />
              <DocumentsSection />
              <GadgetsSection />
            </>
          )}

          {/* Affiliate disclosure footer */}
          <View style={{
            padding: 14,
            backgroundColor: '#141414',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.05)',
            marginTop: 8,
          }}>
            <Text style={{ color: '#444', fontSize: 10, textAlign: 'right', lineHeight: 16 }}>
              חלק מהקישורים בעמוד זה הם קישורי שותפות. AutoSwipe עשויה לקבל עמלה ברכישה ללא עלות נוספת עבורך. כל ההמלצות נבחרו בצורה עצמאית.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
