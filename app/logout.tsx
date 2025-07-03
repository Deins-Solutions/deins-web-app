'use client'

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function Logout() {
    return (
        <Button variant="link" onClick={() => signOut()}>
            Abmelden
        </Button>
    )
}