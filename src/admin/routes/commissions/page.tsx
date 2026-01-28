import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
import { Container, Heading, Table, StatusBadge, Button, Toaster, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

const CommissionsList = () => {
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCommissions = () => {
    fetch("/admin/commissions")
      .then((res) => res.json())
      .then((data) => {
        setCommissions(data.commissions || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchCommissions()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/admin/commissions/${id}/approve`, {
        method: "POST",
      })
      if (res.ok) {
        toast.success("Success", { description: "Commission approved" })
        fetchCommissions()
      } else {
        toast.error("Error", { description: "Failed to approve" })
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return <Container>Loading...</Container>
  }

  return (
    <Container>
      <Toaster />
      <Heading level="h1" className="mb-4">Commissions</Heading>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Order ID</Table.HeaderCell>
            <Table.HeaderCell>Amount</Table.HeaderCell>
            <Table.HeaderCell>Affiliate</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {commissions.map((commission) => (
            <Table.Row key={commission.id}>
              <Table.Cell>{commission.order_id}</Table.Cell>
              <Table.Cell>{commission.amount}</Table.Cell>
              <Table.Cell>{commission.affiliate?.code}</Table.Cell>
              <Table.Cell>
                <StatusBadge color={commission.status === "paid" ? "green" : commission.status === "rejected" ? "red" : "orange"}>
                  {commission.status}
                </StatusBadge>
              </Table.Cell>
              <Table.Cell>
                {commission.status === "pending" && (
                  <Button onClick={() => handleApprove(commission.id)} size="small">
                    Approve
                  </Button>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Commissions",
  icon: CurrencyDollar,
})

export default CommissionsList
