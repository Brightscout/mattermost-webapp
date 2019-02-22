import styled from 'styled-components';

export const VideoUsernameTag = styled.span.attrs({
    className: 'tag is-light is-normal'
})`
position: absolute;
top: 1rem;
left: 1rem;
`;

export const VideoPlaceholder = styled.div.attrs({
  className: 'has-text-centered',
  ref: 'local'
})`
background: linear-gradient(30deg, rgba(138,106,148,1) 12%, rgba(171,69,171,1) 87%);
height: 144px;
width: 200px;
border-radius: 5px;
display: flex;
align-items: center;
color: #fff;
padding: 5px;
`;

export const ErrorNotification = styled.div.attrs({
  className: 'notification is-danger has-text-centered'
})`
margin-top: 10px;
`;


export const MenuLabel = styled.div.attrs({
  className: 'menu-label'
})`
font-size: 14px;
text-transform: none;
letter-spacing: 0em;
`;

export const MenuLabelCentered = styled.div.attrs({
  className: 'menu-label has-text-centered'
})`
font-size: 1em;
text-transform: none;
letter-spacing: 0em;
`;

export const Menu = styled.aside.attrs({
  className: 'menu'
})`
max-width: 13rem;
padding-right: 10px;
border-right: 1px solid rgba(171,69,171,1);
`;

export const RoomNameEntry = styled.input.attrs({
  className: 'is-size-4'
})`
//background: linear-gradient(30deg, rgba(138,106,148,1) 12%, rgba(171,69,171,1) 87%);
background: #f6f0fb;
//border-radius: 2px;
border: none;
box-shadow: none;
border-bottom: 5px solid rgba(171,69,171,1);
text-align: left;
padding-top: 2px;
padding-bottom: 2px;
color: rgba(171,69,171,1);
:focus: {
outline-width: 0;
box-shadow: none;
border-bottom: 5px solid rgba(171,69,171,1);
}
.textarea {
color: rgba(171,69,171,1);
}
::placeholder { /* Chrome, Firefox, Opera, Safari 10.1+ */
    color: rgba(171,69,171,1);;
    opacity: 0.5; /* Firefox */
}

:-ms-input-placeholder {
    color: rgba(171,69,171,1);
    opacity: 0.5; /* Firefox */
}

::-ms-input-placeholder { /* Microsoft Edge */
    color: rgba(171,69,171,1);
opacity: 0.5;
}
`;
