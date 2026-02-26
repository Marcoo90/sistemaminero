import LogisticaModerno from '@/components/logistica/LogisticaModerno';

export const dynamic = 'force-dynamic';

function LoadingSkeleton() {
    return (
        <div className="max-w-7xl mx-auto p-6 md:p-8">
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full animate-spin opacity-20"></div>
                        </div>
                    </div>
                    <p className="text-muted-foreground">Cargando datos de logística...</p>
                </div>
            </div>
        </div>
    );
}

export default function LogisticaPage() {
    return <LogisticaModerno />;
}
