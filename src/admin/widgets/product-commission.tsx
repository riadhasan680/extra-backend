import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Label, Input, Button, Text, toast } from "@medusajs/ui"
import { useState } from "react"

const ProductCommissionWidget = ({ data: product }: { data: any }) => {
  const [commissionRate, setCommissionRate] = useState(product.metadata?.commission_rate || 0)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/admin/products/${product.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: {
            ...product.metadata,
            commission_rate: Number(commissionRate),
          },
        }),
      })

      if (res.ok) {
        toast.success("Success", { description: "Commission rate updated" })
      } else {
        toast.error("Error", { description: "Failed to update commission rate" })
      }
    } catch (error) {
      console.error(error)
      toast.error("Error", { description: "An error occurred" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Commission Settings</Heading>
      </div>
      <div className="px-6 py-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Commission Rate (%)</Label>
          <Input
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            placeholder="0"
          />
          <Text className="text-ui-fg-muted" size="small">
            Override the global default commission rate for this product.
          </Text>
        </div>
        <div className="flex justify-end">
            <Button size="small" variant="secondary" onClick={handleSave} isLoading={saving}>
            Save
            </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductCommissionWidget
