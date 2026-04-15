import { TouchableOpacity, Share as RNShare } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { getListingShareUrl } from '../../lib/public-app-url'

interface BaseShareButtonProps {
  size?: number
  style?: any
}

interface ListingShareButtonProps extends BaseShareButtonProps {
  variant: 'listing'
  listingId: string
  title: string
  price?: number
}

interface CustomShareButtonProps extends BaseShareButtonProps {
  variant: 'custom'
  message: string
  url?: string
}

type ShareButtonProps = ListingShareButtonProps | CustomShareButtonProps

/**
 * Share button for any content type.
 *
 * Usage:
 * - Listings: <ShareButton variant="listing" listingId={id} title={title} price={price} />
 * - Guides: <ShareButton variant="custom" message={`${title}\n${subtitle}`} />
 * - Other: <ShareButton variant="custom" message={msg} url={url} />
 *
 * Uses MaterialCommunityIcons 'share-variant' for consistent styling across content types.
 */
export default function ShareButton(props: ShareButtonProps) {
  const { size = 48, style } = props

  const handleShare = async () => {
    try {
      let message: string

      if (props.variant === 'listing') {
        const shareUrl = getListingShareUrl(props.listingId)
        const priceText = props.price ? ` - ${props.price.toLocaleString('he-IL')} ₪` : ''
        message = `בדוק את הרכב הזה: ${props.title}${priceText}\n\n${shareUrl}`
      } else {
        // Custom: use message as-is, optionally append URL
        message = props.url
          ? `${props.message}\n\n${props.url}`
          : props.message
      }

      await RNShare.share({
        message,
      })
    } catch (error) {
      // Silently ignore if user cancels share dialog
    }
  }

  return (
    <TouchableOpacity
      onPress={handleShare}
      style={[
        {
          width: size,
          height: size,
          borderRadius: 12,
          backgroundColor: 'rgba(212,168,67,0.15)',
          borderWidth: 1.5,
          borderColor: 'rgba(212,168,67,0.4)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
      accessibilityLabel="שתף"
    >
      <MaterialCommunityIcons
        name="share-variant"
        size={size * 0.5}
        color="#D4A843"
      />
    </TouchableOpacity>
  )
}
