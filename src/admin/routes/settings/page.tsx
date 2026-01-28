import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CogSixTooth } from "@medusajs/icons"
import { Container, Heading, Text, Button, Input, Label, Toaster, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    default_commission_rate: 0,
    min_payout_amount: 0,
    webhook_url: "",
    webhook_secret: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/admin/settings", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Ensure cookies are sent
        })

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Unauthorized: Please log in.")
          }
          throw new Error(`Failed to fetch settings: ${res.statusText}`)
        }

        const data = await res.json()
        // Ensure data has the expected shape
        setSettings({
            default_commission_rate: data.default_commission_rate || 0,
            min_payout_amount: data.min_payout_amount || 0,
            webhook_url: data.webhook_url || "",
            webhook_secret: data.webhook_secret || "",
        })
      } catch (err: any) {
        console.error("Settings fetch error:", err)
        setError(err.message)
        toast.error("Error", { description: err.message })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are sent
        body: JSON.stringify(settings),
      })
      
      if (res.ok) {
        toast.success("Success", { description: "Settings saved successfully" })
      } else {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to save settings")
      }
    } catch (error: any) {
      console.error(error)
      toast.error("Error", { description: error.message || "An error occurred" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <Toaster />
        <div className="flex items-center justify-center p-8">
            <Text>Loading settings...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
        <Container>
            <Toaster />
            <Heading level="h1" className="text-ui-fg-error">Error</Heading>
            <Text>{error}</Text>
            <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4">
                Retry
            </Button>
        </Container>
    )
  }

  return (
    <Container>
      <Toaster />
      <Heading level="h1">Affiliate Settings</Heading>
      <Text className="text-ui-fg-muted mb-6">Manage global settings for the affiliate system.</Text>
      
      <div className="flex flex-col gap-4 max-w-md">
        <div className="flex flex-col gap-2">
          <Label>Default Commission Rate (%)</Label>
          <Input 
            type="number" 
            value={settings.default_commission_rate}
            onChange={(e) => setSettings({...settings, default_commission_rate: Number((e.target as HTMLInputElement).value)})}
          />
          <Text size="small" className="text-ui-fg-muted">
            This rate will be used if a product doesn't have a specific commission rate set.
          </Text>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Minimum Payout Amount</Label>
          <Input 
            type="number" 
            value={settings.min_payout_amount}
            onChange={(e) => setSettings({...settings, min_payout_amount: Number((e.target as HTMLInputElement).value)})}
          />
           <Text size="small" className="text-ui-fg-muted">
            Minimum balance required for an affiliate to request a payout.
          </Text>
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          <Heading level="h2">Webhook Configuration</Heading>
          <Text size="small" className="text-ui-fg-muted mb-2">
            Configure a webhook to receive events (commission.created, payout.processed).
          </Text>
          
          <div className="flex flex-col gap-2">
            <Label>Webhook URL</Label>
            <Input 
              type="text" 
              placeholder="https://example.com/webhook"
              value={settings.webhook_url}
              onChange={(e) => setSettings({...settings, webhook_url: (e.target as HTMLInputElement).value})}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Webhook Secret</Label>
            <Input 
              type="password" 
              placeholder="secret_key"
              value={settings.webhook_secret}
              onChange={(e) => setSettings({...settings, webhook_secret: (e.target as HTMLInputElement).value})}
            />
          </div>
        </div>

        <Button onClick={handleSave} isLoading={saving}>
          Save Settings
        </Button>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Settings",
  icon: CogSixTooth,
})

export default SettingsPage
