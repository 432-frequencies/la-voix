import { forwardRef } from 'react';
export const Image = forwardRef(function Image({src,alt='',className='',...props},ref){return <img ref={ref} src={src||'/placeholder.svg'} alt={alt} className={'object-cover '+className} {...props} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src='/placeholder.svg';}}/>;});
