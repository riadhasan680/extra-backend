import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { Container, Heading, Text, clx } from "@medusajs/ui"
import { useEffect, useState } from "react"

const PlatformStats = () => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/admin/platform/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <Container>Loading...</Container>
  }

  return (
    <Container>
      <Heading level="h1">Platform Stats</Heading>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="p-4 border rounded-lg bg-ui-bg-subtle">
          <Text className="text-ui-fg-muted">Total Sales</Text>
          <Heading level="h2">{stats?.total_revenue || 0}</Heading>
        </div>
        <div className="p-4 border rounded-lg bg-ui-bg-subtle">
          <Text className="text-ui-fg-muted">Total Affiliates</Text>
          <Heading level="h2">{stats?.total_affiliates || 0}</Heading>
        </div>
        <div className="p-4 border rounded-lg bg-ui-bg-subtle">
          <Text className="text-ui-fg-muted">Total Commissions</Text>
          <Heading level="h2">{stats?.total_commissions || 0}</Heading>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Platform",
  icon: ChatBubbleLeftRight,
})

export default PlatformStats
