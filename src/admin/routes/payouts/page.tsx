import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar, CheckCircle, XCircle } from "@medusajs/icons"
import { Container, Heading, Table, Button, StatusBadge, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

const PayoutsPage = () => {
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchPayouts = () => {
    setLoading(true)
    fetch("/admin/payouts")
      .then((res) => res.json())
      .then((data) => {
        setPayouts(data.payouts || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchPayouts()
  }, [])

  const handleProcess = async (id: string, status: "paid" | "rejected") => {
    setProcessingId(id)
    try {
      const res = await fetch(`/admin/payouts/${id}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })
      
      if (res.ok) {
        toast.success("Success", { description: `Payout marked as ${status}` })
        fetchPayouts()
      } else {
        const error = await res.json()
        toast.error("Error", { description: error.message || "Failed to process payout" })
      }
    } catch (error) {
      console.error(error)
      toast.error("Error", { description: "An error occurred" })
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "green"
      case "rejected":
        return "red"
      default:
        return "grey"
    }
  }

  return (
    <Container>
      <Heading level="h1" className="mb-6">Payout Requests</Heading>
      
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>ID</Table.HeaderCell>
            <Table.HeaderCell>Affiliate</Table.HeaderCell>
            <Table.HeaderCell>Amount</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Notes</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading ? (
            <Table.Row>
              <Table.Cell colSpan={6} className="text-center py-4">
                <Text>Loading...</Text>
              </Table.Cell>
            </Table.Row>
          ) : payouts.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={6} className="text-center py-4">
                <Text>No payouts found</Text>
              </Table.Cell>
            </Table.Row>
          ) : (
            payouts.map((payout) => (
              <Table.Row key={payout.id}>
                <Table.Cell>{payout.id.slice(0, 8)}...</Table.Cell>
                <Table.Cell>
                    {payout.affiliate ? (
                        <div className="flex flex-col">
                            <span>{payout.affiliate.first_name} {payout.affiliate.last_name}</span>
                            <span className="text-ui-fg-muted text-xs">{payout.affiliate.email}</span>
                        </div>
                    ) : (
                        payout.affiliate_id
                    )}
                </Table.Cell>
                <Table.Cell>{payout.amount} {payout.currency_code?.toUpperCase()}</Table.Cell>
                <Table.Cell>
                  <StatusBadge color={getStatusColor(payout.status)}>
                    {payout.status}
                  </StatusBadge>
                </Table.Cell>
                <Table.Cell className="max-w-[200px] truncate">{payout.notes || "-"}</Table.Cell>
                <Table.Cell>
                  {payout.status === "pending" && (
                    <div className="flex gap-2">
                      <Button 
                        size="small" 
                        variant="secondary"
                        isLoading={processingId === payout.id}
                        onClick={() => handleProcess(payout.id, "paid")}
                      >
                        <CheckCircle /> Pay
                      </Button>
                      <Button 
                        size="small" 
                        variant="danger"
                        isLoading={processingId === payout.id}
                        onClick={() => handleProcess(payout.id, "rejected")}
                      >
                        <XCircle /> Reject
                      </Button>
                    </div>
                  )}
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Payouts",
  icon: CurrencyDollar,
})

export default PayoutsPage
