# Participant Information Form

A small, dependency-free form that collects one participant’s required information per submission. Share the same link with five people; each person completes and submits the form separately, and every result is emailed to the configured receiving inbox.

## Collected fields

For each participant:

- First name
- Last name
- University email ending in `.edu`
- Phone
- University
- Academic level
- LinkedIn profile URL
- Pre/post-competition survey consent choice

## Connect the receiving inbox

Open `config.js` and set the receiving email:

```js
window.FORM_RECEIVER_EMAIL = "organizer@example.com";
```

The page uses [FormSubmit](https://formsubmit.co/) to email each submission to that address. On the first test submission, FormSubmit sends an activation email to the receiving address. Open that email and activate the form; later submissions will then arrive normally.

The receiving email is part of the public JavaScript sent to browsers. For a hidden recipient address or a private dashboard, replace FormSubmit with a private form backend such as Formspree, Supabase, or a serverless API.

## Preview locally

From the repository root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/team-information-form/`.

## GitHub Pages URL

When this directory is merged into the branch currently used by GitHub Pages, the form will be available at:

`https://anson-f.github.io/web-design/team-information-form/`

GitHub Pages hosts the form files but does not store submitted personal information.
