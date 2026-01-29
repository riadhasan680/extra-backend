import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, FocusModal, Heading } from "@medusajs/ui"
import { Plus } from "@medusajs/icons"
import { useState } from "react"
import { ServiceProductForm } from "../components/service-product-form"

const CreateServiceProductWidget = () => {
  const [open, setOpen] = useState(false)

  return (
    <Container className="p-4 flex justify-between items-center mb-4 border-b border-ui-border-base bg-ui-bg-subtle">
      <div className="flex flex-col">
        <Heading level="h2">Service Products</Heading>
        <span className="text-ui-fg-subtle text-small">Manage Extra Life marketing services</span>
      </div>
      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Trigger asChild>
          <Button variant="primary">
            <Plus /> Create Service Product
          </Button>
        </FocusModal.Trigger>
        <FocusModal.Content>
          <FocusModal.Header>
            {/* Header Actions can go here if we hoist state, but we'll keep it simple */}
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col items-center p-8 overflow-y-auto bg-ui-bg-subtle">
             <div className="w-full max-w-[720px] bg-ui-bg-base p-8 rounded-lg border border-ui-border-base shadow-sm">
                <ServiceProductForm onSuccess={() => setOpen(false)} />
             </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default CreateServiceProductWidget
