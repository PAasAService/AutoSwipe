'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="danger"
      size="lg"
      fullWidth
      onClick={() => signOut({ callbackUrl: '/' })}
    >
      <LogOut className="w-4 h-4" />
      התנתק
    </Button>
  )
}
