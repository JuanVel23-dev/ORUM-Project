import { PageHeader, Stack } from '@/components/ui/layout'
import { Card } from '@/components/ui/card'
import { SkeletonText, Skeleton } from '@/components/ui/feedback'

export default function CargandoNovedades() {
  return (
    <div>
      <PageHeader title="Novedades" />
      <Stack gap={5}>
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i} padding="lg">
            <Skeleton width="30%" height="14px" />
            <Skeleton width="60%" height="20px" />
            <SkeletonText lines={2} />
          </Card>
        ))}
      </Stack>
    </div>
  )
}
