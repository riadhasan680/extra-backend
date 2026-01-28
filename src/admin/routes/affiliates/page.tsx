import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Users } from "@medusajs/icons"
import { Container, Heading, Table, StatusBadge, Button } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

const AffiliatesList = () => {
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/admin/affiliates")
      .then((res) => res.json())
      .then((data) => {
        setAffiliates(data.affiliates || [])
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
      <Heading level="h1" className="mb-4">Affiliates</Heading>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Code</Table.HeaderCell>
            <Table.HeaderCell>Rate</Table.HeaderCell>
            <Table.HeaderCell>Sales</Table.HeaderCell>
            <Table.HeaderCell>Balance</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {affiliates.map((affiliate) => (
            <Table.Row key={affiliate.id}>
              <Table.Cell>
                {affiliate.customer ? `${affiliate.customer.first_name} ${affiliate.customer.last_name}` : "N/A"}
              </Table.Cell>
              <Table.Cell>{affiliate.code}</Table.Cell>
              <Table.Cell>{affiliate.commission_rate}%</Table.Cell>
              <Table.Cell>{affiliate.total_sales}</Table.Cell>
              <Table.Cell>{affiliate.balance}</Table.Cell>
              <Table.Cell>
                <StatusBadge color={affiliate.is_active !== false ? "green" : "red"}>
                  {affiliate.is_active !== false ? "Active" : "Disabled"}
                </StatusBadge>
              </Table.Cell>
              <Table.Cell>
                <Link to={`/affiliates/${affiliate.id}`}>
                  <Button variant="secondary" size="small">Details</Button>
                </Link>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Affiliates",
  icon: Users,
})

export default AffiliatesList
