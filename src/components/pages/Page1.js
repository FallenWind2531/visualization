import React from 'react';
import Overview from '../Overview';
import AssistView from '../AssistView';
import DetailView from '../DetailView';

function Page1() {
    return (
        <div className='page'>
            <div className='overview'>
                <Overview />
            </div>
            <div className='otherview'>
                <div className='assistView'>
                    <AssistView />
                </div>
                <div className='detailView'>
                    <DetailView />
                </div>
            </div>
        </div>
    );
}

export default Page1; 