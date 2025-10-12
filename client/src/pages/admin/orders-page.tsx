import { AdminOrders } from '@/components/admin/admin-orders';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

const OrdersPage = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="animate-fade-in">
              <AdminOrders />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default OrdersPage;
