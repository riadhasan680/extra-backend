import { Tag, Plus, Trash, CloudArrowUp } from "@medusajs/icons"
import { Container, Heading, Button, Input, Textarea, Label, Text, toast, Toaster, Badge } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export const ServiceProductForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currencies, setCurrencies] = useState<string[]>(["usd"])

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await fetch("/admin/regions")
        if (res.ok) {
          const data = await res.json()
          const regionCurrencies = data.regions?.map((r: any) => r.currency_code) || []
          // Ensure we have at least 'usd' if no regions, or merge found currencies
          const uniqueCurrencies = Array.from(new Set([...regionCurrencies, "usd"]))
          setCurrencies(uniqueCurrencies)
        }
      } catch (e) {
        console.error("Failed to fetch regions", e)
      }
    }
    fetchRegions()
  }, [])
  
  // Product Info
  const [title, setTitle] = useState("Twitch Stream Promotion")
  const [subtitle, setSubtitle] = useState("Embedded Advertising")
  const [discountText, setDiscountText] = useState("30% OFF NEW CUSTOMER DISCOUNT")
  const [description, setDescription] = useState("Promote your Live Streams with Embedded Advertising")
  
  // Plans (Variants)
  const [plans, setPlans] = useState<{ name: string; price: string; comparePrice: string; dodoPriceId: string }[]>([
    { name: "3 Streams", price: "39.95", comparePrice: "69.90", dodoPriceId: "" },
    { name: "7 Streams", price: "69.95", comparePrice: "119.90", dodoPriceId: "" }
  ])
  
  // Images
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [mainImageUrl, setMainImageUrl] = useState("")
  
  const [detailImage, setDetailImage] = useState<File | null>(null)
  const [detailImageUrl, setDetailImageUrl] = useState("")
  
  const [checkoutImage, setCheckoutImage] = useState<File | null>(null)
  const [checkoutImageUrl, setCheckoutImageUrl] = useState("")

  const handleAddPlan = () => {
    setPlans([...plans, { name: "", price: "", comparePrice: "", dodoPriceId: "" }])
  }

  const handleRemovePlan = (index: number) => {
    const newPlans = [...plans]
    newPlans.splice(index, 1)
    setPlans(newPlans)
  }

  const handlePlanChange = (index: number, field: "name" | "price" | "comparePrice" | "dodoPriceId", value: string) => {
    const newPlans = [...plans]
    newPlans[index][field] = value
    setPlans(newPlans)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "main" | "detail" | "checkout") => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const objectUrl = URL.createObjectURL(file)
      
      if (type === "main") {
        setMainImage(file)
        setMainImageUrl(objectUrl)
      } else if (type === "detail") {
        setDetailImage(file)
        setDetailImageUrl(objectUrl)
      } else {
        setCheckoutImage(file)
        setCheckoutImageUrl(objectUrl)
      }
    }
  }

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append("files", file)
    const res = await fetch("/admin/uploads", {
      method: "POST",
      body: formData,
    })
    if (res.ok) {
      const data = await res.json()
      return data.files?.[0]?.url
    }
    return null
  }

  const handleSubmit = async () => {
    if (!title) {
      toast.error("Error", { description: "Title is required" })
      return
    }
    if (plans.length === 0) {
      toast.error("Error", { description: "At least one plan is required" })
      return
    }

    setLoading(true)

    try {
      // 1. Upload Images
      let finalMainUrl = mainImageUrl
      let finalDetailUrl = detailImageUrl
      let finalCheckoutUrl = checkoutImageUrl

      if (mainImage) finalMainUrl = await uploadFile(mainImage) || mainImageUrl
      if (detailImage) finalDetailUrl = await uploadFile(detailImage) || detailImageUrl
      if (checkoutImage) finalCheckoutUrl = await uploadFile(checkoutImage) || checkoutImageUrl

      const imagesPayload = []
      if (finalMainUrl && finalMainUrl.startsWith("http")) imagesPayload.push({ url: finalMainUrl })
      if (finalDetailUrl && finalDetailUrl.startsWith("http")) imagesPayload.push({ url: finalDetailUrl })
      if (finalCheckoutUrl && finalCheckoutUrl.startsWith("http")) imagesPayload.push({ url: finalCheckoutUrl })

      // 2. Prepare Product Payload
      const payload = {
        title,
        subtitle,
        description,
        is_giftcard: false,
        discountable: true,
        status: "published",
        images: imagesPayload,
        thumbnail: finalMainUrl && finalMainUrl.startsWith("http") ? finalMainUrl : undefined,
        options: [
          {
            title: "Plan",
            values: plans.map(p => p.name)
          }
        ],
        variants: plans.map(p => ({
          title: p.name,
          prices: currencies.map(code => ({
            amount: Math.round(parseFloat(p.price) * 100), // Convert to cents
            currency_code: code
          })),
          options: {
            "Plan": p.name
          },
          metadata: {
            compare_at_price: p.comparePrice ? Math.round(parseFloat(p.comparePrice) * 100) : null,
            dodo_price_id: p.dodoPriceId || undefined
          }
        })),
        metadata: {
          ui_style: "extra-life",
          service_type: "marketing",
          affiliate_enabled: true,
          discount_text: discountText,
          cta_text: "Buy It Now"
        }
      }

      // 3. Create Product
      const res = await fetch("/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success("Success", { description: "Service product created successfully" })
        // Reset form or navigate
        setTitle("")
        setSubtitle("")
        setDiscountText("")
        setDescription("")
        setPlans([{ name: "", price: "", comparePrice: "", dodoPriceId: "" }])
        setMainImage(null); setMainImageUrl("")
        setDetailImage(null); setDetailImageUrl("")
        setCheckoutImage(null); setCheckoutImageUrl("")
        
        if (onSuccess) {
            onSuccess()
        }
      } else {
        const error = await res.json()
        toast.error("Error", { description: error.message || "Failed to create product" })
      }
    } catch (error) {
      console.error(error)
      toast.error("Error", { description: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-6">
      <Toaster />
      <div>
        <Heading level="h1" className="text-2xl font-bold">Create Marketing Service</Heading>
        <Text className="text-ui-fg-subtle">Add a new service product with marketing plans.</Text>
      </div>

      <div className="flex flex-col gap-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-y-2">
            <Label>Service Title</Label>
            <Input 
              placeholder="e.g. Twitch Stream Promotion" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-y-2">
            <Label>Subtitle (Badge Text)</Label>
            <Input 
              placeholder="e.g. Embedded Advertising" 
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Discount Text (Optional)</Label>
            <Input 
              placeholder="e.g. 30% OFF NEW CUSTOMER DISCOUNT" 
              value={discountText}
              onChange={(e) => setDiscountText(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Description</Label>
            <Textarea 
              placeholder="Full service details..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-ui-bg-subtle">
          <div className="flex items-center justify-between mb-4">
            <Heading level="h2" className="text-lg">Marketing Plans (Variants)</Heading>
            <Button variant="secondary" size="small" onClick={handleAddPlan}>
              <Plus /> Add Plan
            </Button>
          </div>
          
          <div className="flex flex-col gap-y-3">
            {plans.map((plan, index) => (
              <div key={index} className="flex items-end gap-x-2">
                <div className="flex-1 flex flex-col gap-y-1">
                  <Label>Plan Name</Label>
                  <Input 
                    placeholder="e.g. 3 Streams" 
                    value={plan.name}
                    onChange={(e) => handlePlanChange(index, "name", e.target.value)}
                  />
                </div>
                <div className="w-[120px] flex flex-col gap-y-1">
                  <Label>Price</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={plan.price}
                    onChange={(e) => handlePlanChange(index, "price", e.target.value)}
                  />
                </div>
                <div className="w-[120px] flex flex-col gap-y-1">
                  <Label>Compare (Old)</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={plan.comparePrice}
                    onChange={(e) => handlePlanChange(index, "comparePrice", e.target.value)}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-y-1">
                  <Label>Dodo Price ID</Label>
                  <Input 
                    placeholder="price_..." 
                    value={plan.dodoPriceId}
                    onChange={(e) => handlePlanChange(index, "dodoPriceId", e.target.value)}
                  />
                </div>
                <Button 
                  variant="danger" 
                  size="small" 
                  className="mb-[2px]"
                  onClick={() => handleRemovePlan(index)}
                >
                  <Trash />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-y-4">
          <Label className="text-base font-semibold">Product Images (Funnel Steps)</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Image */}
            <div className="flex flex-col gap-y-3">
              <Label className="text-small text-ui-fg-subtle font-medium">1. Main Card Image (3D Box Mockup)</Label>
              <div 
                className="relative w-full aspect-[4/3] rounded-xl border-2 border-dashed border-ui-border-base hover:border-ui-border-strong hover:bg-ui-bg-subtle transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group overflow-hidden bg-ui-bg-base"
                onClick={() => document.getElementById("main-image-input")?.click()}
              >
                {mainImageUrl ? (
                   <>
                     <img src={mainImageUrl} alt="Main" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Text className="text-white font-medium">Change Image</Text>
                     </div>
                   </>
                ) : (
                   <>
                     <div className="p-3 rounded-full bg-ui-bg-subtle shadow-sm border border-ui-border-base group-hover:scale-110 transition-transform">
                        <CloudArrowUp className="text-ui-fg-subtle" />
                     </div>
                     <div className="text-center px-4">
                        <span className="text-xs text-ui-fg-subtle font-medium block">Click to upload</span>
                        <span className="text-[10px] text-ui-fg-muted block mt-1">SVG, PNG, JPG</span>
                     </div>
                   </>
                )}
                <input 
                   id="main-image-input"
                   type="file" 
                   accept="image/*"
                   className="hidden"
                   onChange={(e) => handleImageSelect(e, "main")}
                />
              </div>
            </div>

            {/* Detail Image */}
            <div className="flex flex-col gap-y-3">
              <Label className="text-small text-ui-fg-subtle font-medium">2. Detail Page Image</Label>
              <div 
                className="relative w-full aspect-[4/3] rounded-xl border-2 border-dashed border-ui-border-base hover:border-ui-border-strong hover:bg-ui-bg-subtle transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group overflow-hidden bg-ui-bg-base"
                onClick={() => document.getElementById("detail-image-input")?.click()}
              >
                {detailImageUrl ? (
                   <>
                     <img src={detailImageUrl} alt="Detail" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Text className="text-white font-medium">Change Image</Text>
                     </div>
                   </>
                ) : (
                   <>
                     <div className="p-3 rounded-full bg-ui-bg-subtle shadow-sm border border-ui-border-base group-hover:scale-110 transition-transform">
                        <CloudArrowUp className="text-ui-fg-subtle" />
                     </div>
                     <div className="text-center px-4">
                         <span className="text-xs text-ui-fg-subtle font-medium block">Click to upload</span>
                         <span className="text-[10px] text-ui-fg-muted block mt-1">SVG, PNG, JPG</span>
                     </div>
                   </>
                )}
                <input 
                   id="detail-image-input"
                   type="file" 
                   accept="image/*"
                   className="hidden"
                   onChange={(e) => handleImageSelect(e, "detail")}
                />
              </div>
            </div>

            {/* Checkout Image */}
            <div className="flex flex-col gap-y-3">
              <Label className="text-small text-ui-fg-subtle font-medium">3. Checkout Page Image</Label>
              <div 
                className="relative w-full aspect-[4/3] rounded-xl border-2 border-dashed border-ui-border-base hover:border-ui-border-strong hover:bg-ui-bg-subtle transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group overflow-hidden bg-ui-bg-base"
                onClick={() => document.getElementById("checkout-image-input")?.click()}
              >
                {checkoutImageUrl ? (
                   <>
                     <img src={checkoutImageUrl} alt="Checkout" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Text className="text-white font-medium">Change Image</Text>
                     </div>
                   </>
                ) : (
                   <>
                     <div className="p-3 rounded-full bg-ui-bg-subtle shadow-sm border border-ui-border-base group-hover:scale-110 transition-transform">
                        <CloudArrowUp className="text-ui-fg-subtle" />
                     </div>
                     <div className="text-center px-4">
                         <span className="text-xs text-ui-fg-subtle font-medium block">Click to upload</span>
                         <span className="text-[10px] text-ui-fg-muted block mt-1">SVG, PNG, JPG</span>
                     </div>
                   </>
                )}
                <input 
                   id="checkout-image-input"
                   type="file" 
                   accept="image/*"
                   className="hidden"
                   onChange={(e) => handleImageSelect(e, "checkout")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button 
            variant="primary" 
            size="large" 
            onClick={handleSubmit}
            isLoading={loading}
          >
            Create Service Product
          </Button>
        </div>
      </div>
    </div>
  )
}
