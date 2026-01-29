'use client'

import React from 'react'
import { ChevronRight, MapPin } from 'lucide-react'
import Link from 'next/link'

interface BreadcrumbItem {
    id?: string
    nombre?: string
    label?: string
    nivel?: string
    href?: string
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    if (!items || items.length === 0) return null

    return (
        <nav className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-muted-foreground bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm shadow-sm inline-flex">
            <MapPin size={12} className="text-primary-foreground/50" />
            <div className="flex items-center">
                {items.map((item, index) => (
                    <React.Fragment key={item.id || item.label || index}>
                        {item.href ? (
                            <Link href={item.href} className={`hover:text-primary transition-colors ${index === items.length - 1 ? 'text-primary font-bold' : ''}`}>
                                {item.label || item.nombre}
                            </Link>
                        ) : (
                            <span className={`hover:text-primary transition-colors cursor-default ${index === items.length - 1 ? 'text-primary' : ''}`}>
                                {item.label || item.nombre}
                            </span>
                        )}
                        {index < items.length - 1 && (
                            <ChevronRight size={12} className="mx-1 opacity-30" />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </nav>
    )
}
