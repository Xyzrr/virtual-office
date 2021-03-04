import React from 'react';
import { DailyCall } from '@daily-co/daily-js';

export default React.createContext<DailyCall | undefined>(undefined);
