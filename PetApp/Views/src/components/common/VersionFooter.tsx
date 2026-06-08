import React from 'react';
import { APP_VERSION_LABEL } from '../../appVersion';

export const VersionFooter: React.FC = () => {
    return (
        <footer className="petapp-version-footer">
            <span>ACAT - {APP_VERSION_LABEL}</span>
        </footer>
    );
};
