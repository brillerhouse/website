import { Home } from '@/components/Pages';
import { Shell } from '@/components/Shell';
export const metadata = {alternates: {canonical:'https://briller.house/en/', languages:{en:'https://briller.house/en/',uk:'https://briller.house/uk/','x-default':'https://briller.house/en/'}}};
export default function RootPage(){return <Shell locale="en"><Home locale="en"/></Shell>;}
