/**
 *  Oozaru: Sphere for the Web
 *  Copyright (c) 2016-2024, Fat Cerberus
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 *  * Neither the name of Spherical nor the names of its contributors may be
 *    used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
**/

import { parseBMFont } from './bmfont.js';
import Fido from './fido.js';
import { Color, Shape, ShapeType, Texture } from './galileo.js';
import Game from './game.js';

var defaultFont;

export default
class Fontso
{
    static async initialize()
    {
		defaultFont = await Font.fromFile('#/default.fnt');
    }
}

export
class Font
{
	#fileName;
	#glyphAtlas = [];
	#glyphData = {};
	#lineHeight = 0;

	static get Default()
	{
		return defaultFont;
	}

	static async fromFile(...args)
	{
		const fileName = args.length > 1 ? `${args[0].split(".")[0]}-${args[1]}.fnt` : args[0];
		const fontURL = Game.urlOf(fileName);
		let data = await Fido.fetchText(fontURL);
		data = parseBMFont(data);

		// Create font.
		let font = new Font();
		font.#lineHeight = data.common.lineHeight;
		font.#fileName = Game.fullPath(fileName);

		// Load texture.
		let folder = fileName.substring(0, fileName.lastIndexOf("/") + 1) || ""
		for (const page of data.pages)
			font.#glyphAtlas.push(await Texture.fromFile(`${folder}${page}`));

		// Transcribe bmfont data.
		for (const glyph of data.chars)
			font.#glyphData[glyph.id] = {
				width: glyph.width,
				height: glyph.height,
				xOffset: glyph.xoffset,
				yOffset: glyph.yoffset,
				xAdvance: glyph.xadvance,
				atlasIndex: glyph.page,
				u: glyph.x / font.#glyphAtlas[glyph.page].width,
				v: 1.0 - glyph.y / font.#glyphAtlas[glyph.page].height,
				u2: glyph.width / font.#glyphAtlas[glyph.page].width,
				v2: glyph.height / font.#glyphAtlas[glyph.page].height
			};
		
		// Return font.
		return font;
	}
	get glyphAtlas()
	{
		return this.#glyphAtlas
	}

	get fileName()
	{
		return this.#fileName;
	}

	get height()
	{
		return this.#lineHeight;
	}

	drawText(surface, x, y, text, color = Color.White, wrapWidth)
	{
		text = text.toString();
		const lines = wrapWidth !== undefined
			? this.wordWrap(text, wrapWidth)
			: [ text ];
		for (let i = 0, len = lines.length; i < len; ++i)
			this.#renderString(surface, x, y + i * this.#lineHeight, lines[i], color);
	}

	getTextSize(text, wrapWidth)
	{
		text = text.toString();
		if (wrapWidth !== undefined) {
			const lines = this.wordWrap(text, wrapWidth);
			return {
				width: wrapWidth,
				height: lines.length * this.#lineHeight,
			};
		}
		else {
			return {
				width: this.widthOf(text),
				height: this.#lineHeight,
			};
		}
	}

	heightOf(text, wrapWidth)
	{
		return this.getTextSize(text, wrapWidth).height;
	}

	widthOf(text)
	{
		text = text.toString();
		let width = 0;
		for (let ptr = 0; ptr < text.length; ptr++)
		{
			const cp = text.charCodeAt(ptr)
			if (cp == 13) continue
			if (!this.#glyphData[cp]) print(this.#fileName + ", " + text[ptr] + " (" + cp + "), " + text)
			width += this.#glyphData[cp].xAdvance;
		}
		return width;
	}

	wordWrap(text, wrapWidth)
	{
		text = text.toString();
		const lines = [];
		const codepoints = [];
		let currentLine = "";
		let lineWidth = 0;
		let lineFinished = false;
		let wordWidth = 0;
		let wordFinished = false;
		for (let ptr = 0; ptr < text.length; ptr++)
		{
			const cp = text.charCodeAt(ptr)
			const glyph = this.#glyphData[cp];
			switch (cp) {
				case 13: case 10:  // newline
					if (cp === 13 && text.codePointAt(ptr) == 10)
						++ptr;  // treat CRLF as a single newline
					lineFinished = true;
					break;
				case 8:  // tab
					codepoints.push(cp);
					wordWidth += this.#glyphData[32].width * 3;
					wordFinished = true;
					break;
				case 32:  // space
					codepoints.push(cp);
					wordWidth += glyph.xAdvance;
					wordFinished = true;
					break;
				default:
					codepoints.push(cp);
					if (!glyph) print(this.#fileName + ", " + text[ptr] + ", " + text)
					wordWidth += glyph.xAdvance;
					break;
			}
			if (wordFinished || lineFinished) {
				currentLine += String.fromCodePoint(...codepoints);
				lineWidth += wordWidth;
				codepoints.length = 0;
				wordWidth = 0;
				wordFinished = false;
			}
			if (lineWidth + wordWidth > wrapWidth || lineFinished) {
				lines.push(currentLine);
				currentLine = "";
				lineWidth = 0;
				lineFinished = false;
			}
		}
		currentLine += String.fromCodePoint(...codepoints);
		if (currentLine !== "")
			lines.push(currentLine);
		return lines;
	}

	#renderString(surface, x, y, text, color)
	{
		x = Math.trunc(x);
        y = Math.trunc(y);
        if (text === "")
			return;  // empty string, nothing to render
		let xOffset = 0;
		let vertices = {};
		for (let ptr = 0; ptr < text.length; ptr++)
		{
			const cp = text.charCodeAt(ptr)
			if (cp == 13) continue
			const glyph = this.#glyphData[cp];
			const x1 = x + xOffset + glyph.xOffset, x2 = x1 + glyph.width;
			const y1 = y + glyph.yOffset, y2 = y1 + glyph.height;
			const u1 = glyph.u;
			const u2 = u1 + glyph.u2;
			const v1 = glyph.v;
			const v2 = v1 - glyph.v2;
			vertices[glyph.atlasIndex] = vertices[glyph.atlasIndex] || []
			vertices[glyph.atlasIndex].push(
				{ x: x1, y: y1, u: u1, v: v1, color },
				{ x: x2, y: y1, u: u2, v: v1, color },
				{ x: x1, y: y2, u: u1, v: v2, color },
				{ x: x2, y: y1, u: u2, v: v1, color },
				{ x: x1, y: y2, u: u1, v: v2, color },
				{ x: x2, y: y2, u: u2, v: v2, color },
			);
			xOffset += glyph.xAdvance;
		}
		for (const atlasIndex of Object.keys(vertices))
        	Shape.drawImmediate(surface, ShapeType.Triangles, this.#glyphAtlas[atlasIndex], vertices[atlasIndex]);
	}
}