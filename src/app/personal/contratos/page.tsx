import { redirect } from 'next/navigation';

// Legacy route redirect: /personal/contratos → /personal/explosivos
export default function ContratosRedirect() {
    redirect('/personal/explosivos');
}
