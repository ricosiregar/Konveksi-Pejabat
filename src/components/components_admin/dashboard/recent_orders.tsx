// import { Package, Clock, CheckCircle, Truck } from "lucide-react";
// import { cn } from "@/lib/utils";

// const orders = [
//   { 
//     id: "ORD-001",
//     customer: "Ahmad Rizki",
//     product: "Kaos Polos Putih - 50 pcs",
//     status: "processing",
//     date: "2 jam lalu",
//     amount: "Rp 2.500.000",
//   },
//   {
//     id: "ORD-002",
//     customer: "Siti Nurhaliza",
//     product: "Kaos Polos Putih - 100 pcs",
//     status: "shipped",
//     date: "5 jam lalu",
//     amount: "Rp 4.800.000",
//   },
//   {
//     id: "ORD-003",
//     customer: "Budi Santoso",
//     product: "Kaos Polos Putih - 25 pcs",
//     status: "completed",
//     date: "1 hari lalu",
//     amount: "Rp 1.250.000",
//   },
//   {
//     id: "ORD-004",
//     customer: "Dewi Lestari",
//     product: "Kaos Polos Putih - 75 pcs",
//     status: "processing",
//     date: "1 hari lalu",
//     amount: "Rp 3.600.000",
//   },
// ];

// const statusConfig = {
//   processing: {
//     label: "Diproses",
//     icon: Clock,
//     className: "bg-warning/10 text-warning",
//   },
//   shipped: {
//     label: "Dikirim",
//     icon: Truck,
//     className: "bg-accent/10 text-accent",
//   },
//   completed: {
//     label: "Selesai",
//     icon: CheckCircle,
//     className: "bg-success/10 text-success",
//   },
// };

// export const RecentOrders = () => {
//   return (
//     <div className="glass-card rounded-2xl p-6 animate-slide-up delay-300" style={{ animationFillMode: "forwards", opacity: 0 }}>
//       <div className="flex items-center justify-between mb-6">
//         <h2 className="text-lg font-semibold text-foreground">Pesanan Terbaru</h2>
//         <button className="text-sm text-accent hover:underline font-medium">
//           Lihat Semua
//         </button>
//       </div>
//       <div className="space-y-4">
//         {orders.map((order, index) => {
//           const status = statusConfig[order.status as keyof typeof statusConfig];
//           const StatusIcon = status.icon;
//           return (
//             <div
//               key={order.id}
//               className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
//             >
//               <div className="flex items-center gap-4">
//                 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
//                   <Package className="w-5 h-5 text-primary" />
//                 </div>
//                 <div>
//                   <p className="font-medium text-foreground">{order.customer}</p>
//                   <p className="text-sm text-muted-foreground">{order.product}</p>
//                 </div>
//               </div>
//               <div className="text-right">
//                 <p className="font-semibold text-foreground">{order.amount}</p>
//                 <div className="flex items-center gap-1.5 justify-end mt-1">
//                   <span
//                     className={cn(
//                       "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
//                       status.className
//                     )}
//                   >
//                     <StatusIcon className="w-3 h-3" />
//                     {status.label}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };